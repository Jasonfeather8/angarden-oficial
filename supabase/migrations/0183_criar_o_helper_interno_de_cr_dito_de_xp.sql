create or replace function public.creditar_xp_na_ficha(p_character_id text, p_amount numeric, p_reason text)
returns numeric
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_ficha public.fichas;
  v_xp numeric;
begin
  select * into v_ficha from public.fichas f where f.character_id = p_character_id;
  if v_ficha.character_id is null then
    raise exception 'Ficha não encontrada.';
  end if;

  v_xp := greatest(0, coalesce(public.safe_numeric(v_ficha.dados -> 'identidade' ->> 'xp'), 0) + coalesce(p_amount, 0));

  update public.fichas
  set dados = jsonb_set(dados, '{identidade,xp}', to_jsonb(v_xp), true)
  where character_id = p_character_id;

  insert into public.xp_logs (character_id, tenant_id, granted_by, amount, reason)
  values (p_character_id, v_ficha.tenant_id, auth.uid(), coalesce(p_amount, 0), coalesce(nullif(trim(p_reason), ''), 'Concessão de XP'));

  return v_xp;
end;
$function$