begin;

-- The directory edits contact fields. Role changes are managed separately.
revoke insert, update, delete on public.app_users from public, anon, authenticated;
revoke update (role, permissions, active) on public.app_users from public, anon, authenticated;
grant update (full_name, phone) on public.app_users to authenticated;

alter table public.audit_log
  add column actor_name text,
  add column record_label text,
  add column changed_fields text[] not null default '{}';
alter table public.audit_log enable row level security;
revoke all on public.audit_log from public, anon, authenticated;
grant select (id, user_id, actor_name, action, table_name, record_id, record_label, changed_fields, created_at)
  on public.audit_log to authenticated;
drop policy if exists "admins read audit" on public.audit_log;
create policy "superadmin reads audit" on public.audit_log
  for select to authenticated
  using ((select public.has_role(array['superadmin']::public.app_role[])));
create index audit_log_recent_idx on public.audit_log (created_at desc, id desc);

create function gi_private.audit_record_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_label text;
  previous_row jsonb;
  current_row jsonb;
  entry jsonb;
  fields text[] := '{}';
  entry_label text;
begin
  if tg_op <> 'INSERT' then previous_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then current_row := to_jsonb(new); end if;
  if tg_op = 'UPDATE' then
    select coalesce(array_agg(key order by key), '{}') into fields
    from jsonb_each(current_row)
    where key <> 'updated_at' and value is distinct from previous_row -> key;
    if cardinality(fields) = 0 then return null; end if;
  end if;

  entry := coalesce(current_row, previous_row);
  select full_name into actor_label from public.app_users where id = actor;

  if tg_table_name = 'attendance' then
    select concat_ws(' · ', e.title,
      to_char(e.starts_at at time zone 'America/Argentina/Buenos_Aires', 'DD/MM/YYYY'),
      concat_ws(' ', y.first_name, y.last_name))
    into entry_label
    from public.events e, public.young_people y
    where e.id = (entry ->> 'event_id')::uuid and y.id = (entry ->> 'young_person_id')::uuid;
  elsif tg_table_name = 'young_people' then
    entry_label := concat_ws(' ', entry ->> 'first_name', entry ->> 'last_name');
  elsif tg_table_name in ('app_users', 'guardians', 'groups', 'events', 'projects', 'project_tasks', 'inventory_items') then
    entry_label := coalesce(entry ->> 'title', entry ->> 'name', entry ->> 'full_name');
  end if;

  -- Keep the action and the names of changed fields, without copying their values.
  insert into public.audit_log (user_id, actor_name, action, table_name, record_id, record_label, changed_fields)
  values (
    case when actor_label is not null then actor end,
    actor_label, tg_op, tg_table_name,
    coalesce(entry ->> 'id', nullif(concat_ws(' / ',
      entry ->> 'young_person_id', entry ->> 'guardian_id', entry ->> 'group_id',
      entry ->> 'task_id', entry ->> 'user_id'), '')),
    nullif(entry_label, ''), fields
  );
  return null;
end;
$$;
revoke all on function gi_private.audit_record_change() from public, anon, authenticated;

do $$
declare audited_table text;
begin
  foreach audited_table in array array[
    'app_users', 'young_people', 'guardians', 'young_person_guardians', 'medical_profiles',
    'groups', 'young_people_groups', 'events', 'attendance', 'alert_rules', 'alerts', 'followups',
    'projects', 'project_tasks', 'task_assignees', 'notifications',
    'finance_transactions', 'inventory_items', 'inventory_movements'
  ] loop
    execute format('create trigger gi_audit_change after insert or update or delete on public.%I
      for each row execute function gi_private.audit_record_change()', audited_table);
  end loop;
end;
$$;

create table public.app_visits (
  id uuid primary key,
  user_id uuid not null,
  actor_name text not null,
  started_at timestamptz not null,
  last_seen_at timestamptz not null,
  active_seconds integer not null default 0 check (active_seconds >= 0)
);
create index app_visits_recent_idx on public.app_visits (started_at desc, id desc);
alter table public.app_visits enable row level security;
revoke all on public.app_visits from public, anon, authenticated;
grant select on public.app_visits to authenticated;
create policy "superadmin reads app visits" on public.app_visits
  for select to authenticated
  using ((select public.has_role(array['superadmin']::public.app_role[])));

create function gi_private.touch_app_visit(visit_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_label text;
  seen_at timestamptz := clock_timestamp();
begin
  select full_name into actor_label from public.app_users where id = actor and active;
  if actor_label is null or visit_id is null then
    raise exception 'Se requiere una sesión activa' using errcode = '42501';
  end if;

  insert into public.app_visits as visit (id, user_id, actor_name, started_at, last_seen_at)
  values (visit_id, actor, actor_label, seen_at, seen_at)
  on conflict (id) do update set
    active_seconds = visit.active_seconds + case
      when excluded.last_seen_at - visit.last_seen_at <= interval '45 seconds'
      then floor(extract(epoch from excluded.last_seen_at - visit.last_seen_at))::integer
      else 0 end,
    last_seen_at = excluded.last_seen_at
  where visit.user_id = actor and visit.last_seen_at < excluded.last_seen_at;
end;
$$;

create function public.touch_app_visit(visit_id uuid)
returns void language sql security invoker set search_path = ''
as $$
  select gi_private.touch_app_visit(visit_id);
$$;
revoke all on function gi_private.touch_app_visit(uuid), public.touch_app_visit(uuid) from public, anon, authenticated;
grant execute on function gi_private.touch_app_visit(uuid), public.touch_app_visit(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
