alter table public.young_people
  add column sex text check (sex in ('male', 'female'));

-- Keep the existing roster contract for older installations and attendance policies.
-- The new projection only adds sex to rows already visible in the attendance roster.
create function gi_private.attendance_roster_with_sex()
returns table(id uuid, first_name text, last_name text, group_name text, sex text)
language sql stable security definer set search_path = ''
as $$
  select roster.id, roster.first_name, roster.last_name, roster.group_name, person.sex
  from gi_private.attendance_roster() roster
  join public.young_people person on person.id = roster.id
  where auth.uid() is not null
  order by roster.last_name, roster.first_name
$$;

create function public.collaborator_attendance_roster_with_sex()
returns table(id uuid, first_name text, last_name text, group_name text, sex text)
language sql stable security invoker set search_path = ''
as $$
  select * from gi_private.attendance_roster_with_sex()
$$;

revoke all on function gi_private.attendance_roster_with_sex() from public, anon, authenticated;
revoke all on function public.collaborator_attendance_roster_with_sex() from public, anon, authenticated;
grant execute on function gi_private.attendance_roster_with_sex() to authenticated;
grant execute on function public.collaborator_attendance_roster_with_sex() to authenticated;

notify pgrst, 'reload schema';
