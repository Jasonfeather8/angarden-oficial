create policy "library_items_exclusao" on public.library_items for delete to authenticated
using (public.is_admin());