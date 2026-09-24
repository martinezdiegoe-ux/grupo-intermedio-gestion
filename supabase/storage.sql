insert into storage.buckets(id,name,public) values('young-photos','young-photos',false) on conflict(id) do nothing;
create policy "staff view young photos" on storage.objects for select to authenticated using(bucket_id='young-photos');
create policy "authorized upload young photos" on storage.objects for insert to authenticated with check(bucket_id='young-photos' and public.has_permission('youth.write'));
create policy "authorized update young photos" on storage.objects for update to authenticated using(bucket_id='young-photos' and public.has_permission('youth.write')) with check(bucket_id='young-photos' and public.has_permission('youth.write'));
create policy "admins delete young photos" on storage.objects for delete to authenticated using(bucket_id='young-photos' and public.has_role(array['superadmin','admin']::public.app_role[]));
