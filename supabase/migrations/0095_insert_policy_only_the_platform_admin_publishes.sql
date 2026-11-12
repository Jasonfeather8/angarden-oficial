create policy "library_items_insercao" on public.library_items for insert to authenticated
with check (public.is_admin());