-- Ejecutar una vez. Aplica los teléfonos confirmados por Diego sin cambiar nombres.
grant update(full_name, phone) on public.app_users to authenticated;
update public.app_users set phone = case lower(trim(full_name))
 when 'diego martínez' then '3424068443'
 when 'diego martinez' then '3424068443'
 when 'bruno di conza' then '+5493425990381'
 when 'ezequiel parola' then '+5493424072434'
 when 'gabriel salazar' then '3425034370'
 when 'ivana arce' then '+5493424090401'
 when 'valeria budzik' then '5285950'
 else phone end
where lower(trim(full_name)) in ('diego martínez','diego martinez','bruno di conza','ezequiel parola','gabriel salazar','ivana arce','valeria budzik');
notify pgrst, 'reload schema';
