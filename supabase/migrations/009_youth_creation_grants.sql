-- Ejecutar en el SQL Editor para habilitar el alta de jóvenes y su asignación a grupos.
-- Las políticas RLS siguen exigiendo youth.write para crear y editar.
grant select, insert, update on public.young_people to authenticated;
grant select on public.groups to authenticated;
grant select, insert on public.young_people_groups to authenticated;
notify pgrst, 'reload schema';
