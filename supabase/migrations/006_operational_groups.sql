-- Grupos operativos del Grupo Intermedio. Los antiguos sectores se conservan
-- por compatibilidad, pero dejan de estar disponibles para nuevas asignaciones.
insert into public.groups(name,kind,active) values
  ('Elegidos','team',true),
  ('León de Judá','team',true),
  ('Guerreros de Gedeón','team',true),
  ('Valientes de David','team',true)
on conflict(name) do update set kind=excluded.kind,active=true;

update public.groups
set active=false
where name in ('Sector A','Sector B','Sector C');
