-- Permisos de tabla para actualizar los datos del tutor desde el perfil.
-- RLS sigue exigiendo youth.write para escribir.
grant select, insert, update on public.guardians to authenticated;
grant select, insert on public.young_person_guardians to authenticated;
notify pgrst, 'reload schema';
