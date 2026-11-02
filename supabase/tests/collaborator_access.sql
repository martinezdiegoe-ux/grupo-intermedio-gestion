-- Run after both collaborator migrations, as postgres. Fixtures and impersonation
-- are always transaction-local. No auth.users or persistent account changes.
begin;
do $$declare actor uuid; y uuid:=gen_random_uuid(); e uuid:=gen_random_uuid(); p uuid:=gen_random_uuid(); begin
 select id into strict actor from public.app_users where active and role in ('admin','superadmin') order by id limit 1;
 perform set_config('request.jwt.claim.sub',actor::text,true);
 perform set_config('gi.test_youth',y::text,true);
 perform set_config('gi.test_event',e::text,true);
 perform set_config('gi.test_project',p::text,true);
 insert into public.young_people(id,first_name,last_name,birth_date) values(y,'Prueba','Colaborador','2010-01-01');
 insert into public.events(id,title,kind,starts_at,attendance_enabled) values(e,'Prueba de permisos','sunday',now(),true);
 insert into public.projects(id,name,owner_user_id) values(p,'Prueba de permisos',actor);
 update public.app_users set role='collaborator',permissions=array['attendance.write','projects.write','medical.read','youth.write'] where id=actor;
end $$;
set local role authenticated;
do $$declare n int; t text; begin
 if not public.has_permission('attendance.write') or public.has_permission('projects.write') or public.has_permission('medical.read') or public.has_permission('youth.write') then raise exception 'Unexpected collaborator permissions'; end if;
 if not exists(select 1 from public.collaborator_attendance_roster() where id=current_setting('gi.test_youth')::uuid) then raise exception 'Roster missing'; end if;
 if not exists(select 1 from public.collaborator_project_people() where id=auth.uid()) then raise exception 'Project people missing'; end if;
 foreach t in array array['young_people','young_people_view','guardians','young_person_guardians','medical_profiles','young_person_private','alerts','alert_rules','followups','finance_transactions','audit_log','groups','young_people_groups'] loop
  begin execute format('select count(*) from public.%I',t) into n; if n<>0 then raise exception 'Private rows accessible: %',t; end if; exception when insufficient_privilege then null; end;
 end loop;
 if (select count(*) from public.app_users)<>1 then raise exception 'User directory exposed'; end if;
 if exists(select 1 from storage.objects) then raise exception 'Storage exposed'; end if;
 if not exists(select 1 from public.projects where id=current_setting('gi.test_project')::uuid) then raise exception 'Cannot read projects'; end if;
 if not exists(select 1 from public.events where id=current_setting('gi.test_event')::uuid) then raise exception 'Cannot read calendar'; end if;
 insert into public.attendance(event_id,young_person_id,status,recorded_by) values(current_setting('gi.test_event')::uuid,current_setting('gi.test_youth')::uuid,'present',auth.uid());
 update public.attendance set status='absent' where event_id=current_setting('gi.test_event')::uuid;get diagnostics n=row_count;if n<>1 then raise exception 'Cannot update attendance';end if;
 perform public.upsert_attendance(current_setting('gi.test_event')::uuid,current_setting('gi.test_youth')::uuid,'present',null);
 update public.projects set name='forbidden' where id=current_setting('gi.test_project')::uuid;get diagnostics n=row_count;if n<>0 then raise exception 'Can edit projects';end if;
 update public.events set title='forbidden' where id=current_setting('gi.test_event')::uuid;get diagnostics n=row_count;if n<>0 then raise exception 'Can edit events';end if;
 begin insert into public.projects(name) values('forbidden');raise exception 'Can create projects';exception when insufficient_privilege then null;end;
 begin insert into public.events(title,kind,starts_at) values('forbidden','sunday',now());raise exception 'Can create events';exception when insufficient_privilege then null;end;
 begin insert into public.attendance(event_id,young_person_id,status,recorded_by) values(current_setting('gi.test_event')::uuid,current_setting('gi.test_youth')::uuid,'present',gen_random_uuid());raise exception 'Can spoof attendance author';exception when insufficient_privilege then null;end;
 update public.app_users set full_name='forbidden' where id=auth.uid();get diagnostics n=row_count;if n<>0 then raise exception 'Can edit user';end if;
 insert into public.push_devices(user_id,token,platform) values(auth.uid(),'test-'||current_setting('gi.test_event'),'web');
 begin insert into public.push_devices(user_id,token,platform) values(gen_random_uuid(),'other-'||current_setting('gi.test_event'),'web');raise exception 'Can register other device';exception when insufficient_privilege then null;end;
 begin insert into public.notifications(title,body,target_user_id,sent_by) values('test','forbidden',auth.uid(),auth.uid());raise exception 'Can send notice';exception when insufficient_privilege then null;end;
 if has_table_privilege('authenticated','public.attendance','TRUNCATE') then raise exception 'Can truncate';end if;
end $$;
reset role;
update public.app_users set active=false where id=current_setting('request.jwt.claim.sub')::uuid;
set local role authenticated;
do $$begin
 if exists(select 1 from public.collaborator_attendance_roster()) or exists(select 1 from public.events) or exists(select 1 from public.projects) or exists(select 1 from public.app_users) then raise exception 'Inactive account still authorized';end if;
end $$;
reset role;
select 'Collaborator access assertions passed; rolling back fixtures' as result;
rollback;
