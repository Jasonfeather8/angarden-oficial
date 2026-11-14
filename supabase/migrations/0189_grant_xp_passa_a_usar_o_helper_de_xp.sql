create or replace function public.grant_xp(p_character_id text, p_amount numeric, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_ficha public.fichas;
  v_xp numeric;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Informe uma quantidade de XP maior que zero.';
  end if;
  if coalesce(trim(p_reason), '') = '' then
    raise exception 'Informe o motivo da concessão.';
  end if;

  select * into v_ficha from public.fichas f where f.character_id = p_character_id;
  if v_ficha.character_id is null then
    raise exception 'Ficha não encontrada.';
  end if;
  if not (public.is_admin() or public.is_privileged() or (public.is_mestre() and v_ficha.tenant_id = public.current_tenant_id())) then
    raise exception 'Sem permissão para conceder XP nesta ficha.';
  end if;

  v_xp := public.creditar_xp_na_ficha(p_character_id, p_amount, trim(p_reason));

  return jsonb_build_object('character_id', p_character_id, 'xp', v_xp);
end;
$function$