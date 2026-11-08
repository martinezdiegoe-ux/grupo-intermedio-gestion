-- Read-only verification against existing accounts. No fixture or user changes.
begin read only;
select set_config('gi.expected_photos',(select count(*)::text from public.young_people y join storage.objects o on o.bucket_id='young-photos' and o.name=y.photo_path where y.active and y.deleted_at is null),true);
select set_config('gi.staff',(select id::text from public.app_users where active and role in ('admin','superadmin','instructor') order by id limit 1),true);
select set_config('request.jwt.claim.sub',(select id::text from public.app_users where active and role='collaborator' order by id limit 1),true);
set local role authenticated;
do $$begin
 if auth.uid() is null then raise exception 'No active collaborator found';end if;
 if (select count(*) from storage.objects)<>current_setting('gi.expected_photos')::int then raise exception 'Collaborator photo count mismatch';end if;
 if exists(select 1 from storage.objects o where o.bucket_id<>'young-photos' or not exists(select 1 from public.collaborator_attendance_photos() p where p.photo_path=o.name)) then raise exception 'Private files exposed';end if;
 if exists(select 1 from public.young_people) then raise exception 'Private youth profiles exposed';end if;
 if not exists(select 1 from public.collaborator_attendance_photos()) then raise exception 'Current photos missing';end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('gi.staff'),true);
set local role authenticated;
do $$begin
 if not exists(select 1 from storage.objects where bucket_id='young-photos') then raise exception 'Staff photo access missing';end if;
end $$;
reset role;
-- A nonexistent identity must see neither photos nor storage metadata.
select set_config('request.jwt.claim.sub',gen_random_uuid()::text,true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.collaborator_attendance_photos()) or exists(select 1 from storage.objects) then raise exception 'Unknown user can read photos';end if;
end $$;
reset role;
do $$begin
 if has_function_privilege('anon','public.collaborator_attendance_photos()','EXECUTE') then raise exception 'Anonymous photo RPC exposed';end if;
 if not exists(select 1 from storage.buckets where id='young-photos' and not public) then raise exception 'Photo bucket is public';end if;
end $$;
rollback;
select 'Attendance photo read-only assertions passed' as result;
