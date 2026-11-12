create policy "biblioteca_edicao" on storage.objects for update to authenticated
using (bucket_id = 'biblioteca' and public.pode_gerir_biblioteca())
with check (bucket_id = 'biblioteca' and public.pode_gerir_biblioteca());