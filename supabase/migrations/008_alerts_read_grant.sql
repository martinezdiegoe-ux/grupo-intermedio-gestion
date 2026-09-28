-- Permite consultar alertas existentes; la política RLS de lectura sigue vigente.
grant select on public.alerts to authenticated;
notify pgrst, 'reload schema';
