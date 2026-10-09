-- Ejecutar una sola vez. Sólo cambia el rol de la cuenta activa identificada.
begin;
do $$
declare target_id uuid; matches integer;
begin
 select count(*),min(id::text)::uuid into matches,target_id from public.app_users
 where active and lower(regexp_replace(btrim(full_name),'\s+',' ','g'))='bruno di conza';
 if matches<>1 then raise exception 'Se esperaba una cuenta activa de Bruno Di Conza, se encontraron %. No se cambió ningún permiso.',matches; end if;
 update public.app_users set role='superadmin',updated_at=now() where id=target_id;
end $$;
commit;
-- Verificar el resultado. Bruno debe cerrar sesión e ingresar nuevamente.
select full_name,email,role,active from public.app_users where lower(regexp_replace(btrim(full_name),'\s+',' ','g'))='bruno di conza';
