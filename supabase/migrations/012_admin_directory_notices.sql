-- Ejecutar en SQL Editor antes de usar el directorio y los avisos.
alter table public.app_users add column if not exists phone text;
grant select on public.app_users to authenticated;
grant update(phone) on public.app_users to authenticated;
grant select, insert on public.notifications to authenticated;
notify pgrst, 'reload schema';
