create policy "biblioteca_envio" on storage.objects for insert to authenticated
with check (bucket_id = 'biblioteca' and public.pode_gerir_biblioteca());