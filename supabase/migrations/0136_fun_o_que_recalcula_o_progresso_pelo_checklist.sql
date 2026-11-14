create or replace function public.recalcular_progresso_da_cronica()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_cronica uuid := coalesce(new.chronicle_id, old.chronicle_id);
  v_total integer;
  v_concluidos integer;
begin
  select count(*), count(*) filter (where o.concluido)
    into v_total, v_concluidos
  from public.chronicle_objectives o
  where o.chronicle_id = v_cronica;

  update public.chronicles
  set progresso = case when v_total > 0 then round(100.0 * v_concluidos / v_total) else 0 end
  where id = v_cronica;

  return null;
end;
$function$