create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  category text not null check (category in ('durable', 'consumable')),
  quantity numeric(12,3) not null check (quantity between 0 and 999999999.999),
  unit text not null check (char_length(btrim(unit)) between 1 and 30),
  -- Keep the recorded identity even if the account is removed later.
  responsible_id uuid,
  responsible_name text,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create table public.inventory_movements (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.inventory_items(id),
  actor_id uuid not null,
  actor_name text not null,
  occurred_at timestamptz not null,
  previous_values jsonb,
  current_values jsonb not null
);

create index inventory_items_name_id_idx on public.inventory_items (name, id);
create index inventory_movements_item_id_idx on public.inventory_movements (item_id, id desc);

alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
revoke all on public.inventory_items, public.inventory_movements from public, anon, authenticated;
grant select on public.inventory_items, public.inventory_movements to authenticated;
grant insert (name, category, quantity, unit, responsible_id),
      update (name, category, quantity, unit, responsible_id)
on public.inventory_items to authenticated;

create policy inventory_items_staff_read on public.inventory_items
for select to authenticated
using ((select public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[])));

create policy inventory_movements_staff_read on public.inventory_movements
for select to authenticated
using ((select public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[])));

create policy inventory_items_admin_insert on public.inventory_items
for insert to authenticated
with check ((select public.has_role(array['superadmin','admin']::public.app_role[])));

create policy inventory_items_admin_update on public.inventory_items
for update to authenticated
using ((select public.has_role(array['superadmin','admin']::public.app_role[])))
with check ((select public.has_role(array['superadmin','admin']::public.app_role[])));

create function gi_private.inventory_responsibles()
returns table (id uuid, full_name text)
language sql stable security definer set search_path = ''
as $$
  select u.id, u.full_name
  from public.app_users u
  where u.active
    and auth.uid() is not null
    and (select public.has_role(array['superadmin','admin']::public.app_role[]))
  order by u.full_name, u.id
$$;

create function public.inventory_responsibles()
returns table (id uuid, full_name text)
language sql stable security invoker set search_path = ''
as $$
  select * from gi_private.inventory_responsibles()
$$;

revoke all on function gi_private.inventory_responsibles() from public, anon, authenticated;
revoke all on function public.inventory_responsibles() from public, anon, authenticated;
grant execute on function gi_private.inventory_responsibles() to authenticated;
grant execute on function public.inventory_responsibles() to authenticated;

create function gi_private.prepare_inventory_item()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null or not public.has_role(array['superadmin','admin']::public.app_role[]) then
    raise exception 'No tenés permiso para modificar el inventario.' using errcode = '42501';
  end if;

  new.name := btrim(new.name);
  new.unit := btrim(new.unit);
  if tg_op = 'UPDATE' then
    if row(new.name, new.category, new.quantity, new.unit, new.responsible_id)
       is not distinct from row(old.name, old.category, old.quantity, old.unit, old.responsible_id) then
      return old;
    end if;
    new.version := old.version + 1;
  end if;

  if new.responsible_id is null then
    new.responsible_name := null;
  elsif tg_op = 'UPDATE' and new.responsible_id = old.responsible_id then
    new.responsible_name := old.responsible_name;
  else
    select u.full_name into new.responsible_name
    from public.app_users u
    where u.id = new.responsible_id and u.active;
    if not found then
      raise exception 'Elegí un responsable con una cuenta activa.' using errcode = '23514';
    end if;
  end if;

  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create function gi_private.record_inventory_movement()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  actor_full_name text;
  previous jsonb;
begin
  if tg_op = 'UPDATE' then
    if new.version = old.version then
      return null;
    end if;
    previous := to_jsonb(old) - array['id','version','updated_at'];
  end if;

  select u.full_name into strict actor_full_name
  from public.app_users u
  where u.id = actor and u.active;

  insert into public.inventory_movements (item_id, actor_id, actor_name, occurred_at, previous_values, current_values)
  values (new.id, actor, actor_full_name, new.updated_at, previous,
          to_jsonb(new) - array['id','version','updated_at']);
  return null;
end;
$$;

revoke all on function gi_private.prepare_inventory_item() from public, anon, authenticated;
revoke all on function gi_private.record_inventory_movement() from public, anon, authenticated;

create trigger prepare_inventory_item
before insert or update on public.inventory_items
for each row execute function gi_private.prepare_inventory_item();

create trigger record_inventory_movement
after insert or update on public.inventory_items
for each row execute function gi_private.record_inventory_movement();

notify pgrst, 'reload schema';
