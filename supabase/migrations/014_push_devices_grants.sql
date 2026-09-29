-- Las suscripciones son privadas: cada usuario solo administra sus dispositivos (RLS 002).
grant select, insert, update, delete on public.push_devices to authenticated;
notify pgrst, 'reload schema';
