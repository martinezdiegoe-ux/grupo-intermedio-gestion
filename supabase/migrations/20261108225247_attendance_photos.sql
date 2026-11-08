-- Expose only the current photo of an active attendance-roster member.
-- The existing roster signature stays unchanged because RLS depends on it.
create or replace function gi_private.attendance_photos()
returns table(id uuid,photo_path text)
language sql stable security definer set search_path='' as $$
 select y.id,y.photo_path from public.young_people y
 where auth.uid() is not null
  and public.has_role(array['collaborator']::public.app_role[])
  and y.active and y.deleted_at is null and y.photo_path is not null
$$;
revoke all on function gi_private.attendance_photos() from public,anon;
grant execute on function gi_private.attendance_photos() to authenticated;

create or replace function public.collaborator_attendance_photos()
returns table(id uuid,photo_path text)
language sql stable security invoker set search_path='' as $$
 select * from gi_private.attendance_photos()
$$;
revoke all on function public.collaborator_attendance_photos() from public,anon;
grant execute on function public.collaborator_attendance_photos() to authenticated;

-- Keep the bucket private. Collaborators can sign/read just those current photos.
alter policy collaborator_no_storage on storage.objects
 using(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[])
  or (bucket_id='young-photos' and name in (select p.photo_path from gi_private.attendance_photos() p)))
 with check(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]));
create policy collaborator_no_storage_delete on storage.objects as restrictive
 for delete to authenticated
 using(public.has_role(array['superadmin','admin','leader','instructor']::public.app_role[]));

notify pgrst, 'reload schema';
