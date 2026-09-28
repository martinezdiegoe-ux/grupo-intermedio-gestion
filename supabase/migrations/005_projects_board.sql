-- Ejecutar una vez en el SQL Editor de Supabase. Los GRANT habilitan la API;
-- las políticas RLS existentes siguen decidiendo quién puede leer y escribir.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.projects, public.project_tasks, public.task_assignees to authenticated;
grant select on public.app_users to authenticated;

do $$ begin
  create policy "staff read project team" on public.app_users
    for select to authenticated
    using (public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]));
exception when duplicate_object then null; end $$;

-- Refresca PostgREST después de aplicar los permisos.
notify pgrst, 'reload schema';
