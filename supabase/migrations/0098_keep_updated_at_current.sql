create trigger library_items_updated_at before update on public.library_items
for each row execute function public.set_updated_at();