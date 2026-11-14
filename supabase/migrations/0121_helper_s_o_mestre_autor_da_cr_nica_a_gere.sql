create or replace function public.pode_gerir_cronica(p_chronicle_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select public.is_admin() or exists (
    select 1
    from public.chronicles c
    where c.id = p_chronicle_id
      and c.tenant_id = public.current_tenant_id()
      and c.created_by = auth.uid()
  )
$function$