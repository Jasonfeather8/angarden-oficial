create policy "midia_envio" on storage.objects for insert to authenticated
with check (
  bucket_id = 'midia'
  and public.pode_escrever_midia((storage.foldername(name))[1])
)