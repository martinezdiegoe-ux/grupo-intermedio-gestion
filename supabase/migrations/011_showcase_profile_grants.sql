-- Ejecutar una sola vez en Supabase SQL Editor antes de cargar fichas médicas.
alter table public.medical_profiles add column if not exists medication_reason text;
alter table public.medical_profiles add column if not exists insurance_member_number text;
alter table public.medical_profiles add column if not exists surgeries text;
alter table public.medical_profiles add column if not exists activity_restrictions text;
alter table public.medical_profiles add column if not exists dietary_restrictions text;

grant usage on schema public to authenticated;
grant select, insert, update on public.medical_profiles to authenticated;
grant select, insert, update on public.guardians to authenticated;
grant select, insert on public.young_person_guardians to authenticated;
grant select, insert, update on public.young_people to authenticated;
grant select, insert on public.young_people_groups to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select on public.attendance to authenticated;

notify pgrst, 'reload schema';
