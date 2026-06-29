
-- Policies for storage.objects scoped to course-covers bucket
create policy "course_covers_admin_insert"
on storage.objects for insert to authenticated
with check (bucket_id = 'course-covers' and public.has_role(auth.uid(),'admin'));

create policy "course_covers_admin_update"
on storage.objects for update to authenticated
using (bucket_id = 'course-covers' and public.has_role(auth.uid(),'admin'))
with check (bucket_id = 'course-covers' and public.has_role(auth.uid(),'admin'));

create policy "course_covers_admin_delete"
on storage.objects for delete to authenticated
using (bucket_id = 'course-covers' and public.has_role(auth.uid(),'admin'));

create policy "course_covers_authenticated_read"
on storage.objects for select to authenticated
using (bucket_id = 'course-covers');
