create policy "biblioteca_exclusao" on storage.objects for delete to authenticated
using (bucket_id = 'biblioteca' and public.pode_gerir_biblioteca());