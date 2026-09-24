insert into public.groups(name,kind) values ('Sector A','sector'),('Sector B','sector'),('Sector C','sector'),('Coro','ministry') on conflict(name) do nothing;
insert into public.alert_rules(name,level,consecutive_absences,attendance_rate_below,lookback_events)
select 'Seguimiento por 2 ausencias','yellow',2,null,8 where not exists(select 1 from public.alert_rules where name='Seguimiento por 2 ausencias');
insert into public.alert_rules(name,level,consecutive_absences,attendance_rate_below,lookback_events)
select 'Contacto por 3 ausencias','red',3,null,8 where not exists(select 1 from public.alert_rules where name='Contacto por 3 ausencias');
insert into public.alert_rules(name,level,consecutive_absences,attendance_rate_below,lookback_events)
select 'Asistencia menor al 65%','red',null,65,8 where not exists(select 1 from public.alert_rules where name='Asistencia menor al 65%');
