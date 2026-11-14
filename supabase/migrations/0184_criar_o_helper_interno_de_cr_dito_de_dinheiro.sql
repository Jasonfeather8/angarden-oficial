create or replace function public.creditar_dinheiro_na_ficha(p_character_id text, p_delta numeric)
returns numeric
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_ficha public.fichas;
  v_dinheiro numeric;
begin
  select * into v_ficha from public.fichas f where f.character_id = p_character_id;
  if v_ficha.character_id is null then
    raise exception 'Ficha não encontrada.';
  end if;

  v_dinheiro := greatest(0, coalesce(public.safe_numeric(v_ficha.dados -> 'recursos' ->> 'dinheiro'), 0) + coalesce(p_delta, 0));

  update public.fichas
  set dados = jsonb_set(dados, '{recursos,dinheiro}', to_jsonb(v_dinheiro), true)
  where character_id = p_character_id;

  return v_dinheiro;
end;
$function$