
create policy "Admins manage thumbnails" on storage.objects for all to authenticated
  using (bucket_id = 'thumbnails' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'thumbnails' and public.has_role(auth.uid(),'admin'));
