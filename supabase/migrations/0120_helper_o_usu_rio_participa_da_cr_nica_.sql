create or replace function public.is_chronicle_participant(p_chronicle_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
    select 1
    from public.chronicle_participants p
    where p.chronicle_id = p_chronicle_id
      and p.user_id = auth.uid()
  )
$function$