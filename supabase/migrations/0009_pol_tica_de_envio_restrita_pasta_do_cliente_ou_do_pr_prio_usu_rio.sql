create policy "midia_envio" on storage.objects for insert to authenticated with check (
  bucket_id = 'midia'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] in (public.current_tenant_id()::text, auth.uid()::text)
  )
)