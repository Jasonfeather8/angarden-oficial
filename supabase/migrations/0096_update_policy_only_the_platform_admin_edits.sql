create policy "library_items_edicao" on public.library_items for update to authenticated
using (public.is_admin()) with check (public.is_admin());