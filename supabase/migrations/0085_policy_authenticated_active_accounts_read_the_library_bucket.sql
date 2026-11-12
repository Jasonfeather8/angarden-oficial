create policy "biblioteca_leitura" on storage.objects for select to authenticated
using (bucket_id = 'biblioteca' and public.pode_ler_biblioteca());