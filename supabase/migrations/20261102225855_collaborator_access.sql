-- Collaborators can only record attendance and read events, projects and notices.
create schema if not exists gi_private;
revoke all on schema gi_private from public, anon;
grant usage on schema gi_private to authenticated;

-- Never let extra permission strings broaden the collaborator role.
create or replace function public.has_permission(p text) returns boolean
language sql stable security definer set search_path=public as $$
select exists(select 1 from public.app_users where id=auth.uid() and active=true
 and (role in ('superadmin','admin') or (p=any(permissions)
 and (role::text<>'collaborator' or p='attendance.write'))))
$$;

create or replace function gi_private.attendance_roster()
returns table(id uuid,first_name text,last_name text,group_name text)
language sql stable security definer set search_path='' as $$
select y.id,y.first_name,y.last_name,
 (select min(g.name) from public.young_people_groups yg join public.groups g on g.id=yg.group_id and g.active where yg.young_person_id=y.id)
from public.young_people y
where public.has_role(array['collaborator']::public.app_role[]) and y.active and y.deleted_at is null
order by y.last_name,y.first_name
$$;
revoke all on function gi_private.attendance_roster() from public,anon;
grant execute on function gi_private.attendance_roster() to authenticated;
create or replace function public.collaborator_attendance_roster()
returns table(id uuid,first_name text,last_name text,group_name text)
language sql stable security invoker set search_path='' as $$
select * from gi_private.attendance_roster()
$$;
revoke all on function public.collaborator_attendance_roster() from public,anon;
grant execute on function public.collaborator_attendance_roster() to authenticated;

create or replace function gi_private.project_people()
returns table(id uuid,full_name text)
language sql stable security definer set search_path='' as $$
select u.id,u.full_name from public.app_users u
where public.has_role(array['collaborator']::public.app_role[]) and
 (exists(select 1 from public.projects p where p.owner_user_id=u.id)
 or exists(select 1 from public.task_assignees a join public.project_tasks t on t.id=a.task_id join public.projects p on p.id=t.project_id where a.user_id=u.id))
$$;
revoke all on function gi_private.project_people() from public,anon;
grant execute on function gi_private.project_people() to authenticated;
create or replace function public.collaborator_project_people()
returns table(id uuid,full_name text)
language sql stable security invoker set search_path='' as $$
select * from gi_private.project_people()
$$;
revoke all on function public.collaborator_project_people() from public,anon;
grant execute on function public.collaborator_project_people() to authenticated;

-- Narrow existing permissive policies without replacing staff policies.
do $$
declare t text;
begin
 foreach t in array array['young_people','guardians','young_person_guardians','medical_profiles','young_person_private','groups','young_people_groups','alerts','alert_rules','followups','finance_transactions','audit_log'] loop
  execute format('create policy collaborator_no_access on public.%I as restrictive for all to authenticated using(public.has_role(array[''superadmin'',''admin'',''leader'',''instructor'']::public.app_role[])) with check(public.has_role(array[''superadmin'',''admin'',''leader'',''instructor'']::public.app_role[]))',t);
 end loop;
 foreach t in array array['events','projects','project_tasks','task_assignees'] loop
  execute format('create policy collaborator_read_only on public.%I as restrictive for select to authenticated using(public.has_role(array[''superadmin'',''admin'',''leader'',''instructor'',''collaborator'']::public.app_role[]))',t);
  execute format('create policy collaborator_no_insert on public.%I as restrictive for insert to authenticated with check(public.has_role(array[''superadmin'',''admin'',''leader'',''instructor'']::public.app_role[]))',t);
  execute format('create policy collaborator_no_update on public.%I as restrictive for update to authenticated using(public.has_role(array[''superadmin'',''admin'',''leader'',''instructor'']::public.app_role[])) with check(public.has_role(array[''superadmin'',''admin'',''leader'',''instructor'']::public.app_role[]))',t);
  execute format('create policy collaborator_no_delete on public.%I as restrictive for delete to authenticated using(public.has_role(array[''superadmin'',''admin'',''leader'',''instructor'']::public.app_role[]))',t);
 end loop;
end $$;

create policy collaborator_own_profile on public.app_users as restrictive for all to authenticated
 using(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]) or (id=auth.uid() and active and role::text='collaborator'))
 with check(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]));
create policy collaborator_attendance_read on public.attendance as restrictive for select to authenticated
 using(public.has_role(array['superadmin','admin','leader','instructor','collaborator']::public.app_role[]));
create policy collaborator_attendance_insert on public.attendance as restrictive for insert to authenticated
 with check(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]) or
 (public.has_role(array['collaborator']::public.app_role[]) and recorded_by=auth.uid()
 and exists(select 1 from public.events e where e.id=event_id and e.attendance_enabled and e.kind in ('sunday','rehearsal'))
 and young_person_id in (select r.id from gi_private.attendance_roster() r)));
create policy collaborator_attendance_update on public.attendance as restrictive for update to authenticated
 using(public.has_role(array['superadmin','admin','leader','instructor','collaborator']::public.app_role[]))
 with check(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]) or
 (public.has_role(array['collaborator']::public.app_role[]) and recorded_by=auth.uid()
 and exists(select 1 from public.events e where e.id=event_id and e.attendance_enabled and e.kind in ('sunday','rehearsal'))
 and young_person_id in (select r.id from gi_private.attendance_roster() r)));
create policy collaborator_attendance_no_delete on public.attendance as restrictive for delete to authenticated
 using(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]));

create policy collaborator_notifications on public.notifications as restrictive for select to authenticated
 using(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]) or
 (public.has_role(array['collaborator']::public.app_role[]) and
 (target_user_id=auth.uid() or (target_user_id is null and (target_role is null or target_role::text='collaborator')))));
create policy collaborator_push on public.push_devices as restrictive for all to authenticated
 using(public.has_role(array['superadmin','admin','leader','instructor','collaborator']::public.app_role[]))
 with check(public.has_role(array['superadmin','admin','leader','instructor','collaborator']::public.app_role[]));
create policy collaborator_no_storage on storage.objects as restrictive for all to authenticated
 using(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]))
 with check(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]));

-- Existing RPC must obey the same RLS as direct writes.
alter function public.upsert_attendance(uuid,uuid,public.attendance_status,text) security invoker;
revoke all on function public.upsert_attendance(uuid,uuid,public.attendance_status,text) from public,anon;
grant execute on function public.upsert_attendance(uuid,uuid,public.attendance_status,text) to authenticated;

-- TRUNCATE bypasses RLS and is never needed by the application.
revoke truncate on all tables in schema public from authenticated,anon;
notify pgrst, 'reload schema';
