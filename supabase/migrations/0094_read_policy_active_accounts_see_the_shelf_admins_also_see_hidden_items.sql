create policy "library_items_leitura" on public.library_items for select to authenticated
using (public.is_active() and (public.is_admin() or not oculto));