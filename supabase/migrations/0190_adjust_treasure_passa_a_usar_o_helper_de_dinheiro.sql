create or replace function public.adjust_treasure(p_character_id text, p_delta numeric)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_ficha public.fichas;
  v_money numeric;
begin
  if p_delta is null or p_delta = 0 then
    raise exception 'Informe um valor de ajuste diferente de zero.';
  end if;

  select * into v_ficha from public.fichas f where f.character_id = p_character_id;
  if v_ficha.character_id is null then
    raise exception 'Ficha não encontrada.';
  end if;
  if not (public.is_admin() or public.is_privileged() or (public.is_mestre() and v_ficha.tenant_id = public.current_tenant_id())) then
    raise exception 'Sem permissão para ajustar o tesouro desta ficha.';
  end if;

  v_money := public.creditar_dinheiro_na_ficha(p_character_id, p_delta);

  return jsonb_build_object('character_id', p_character_id, 'dinheiro', v_money);
end;
$function$