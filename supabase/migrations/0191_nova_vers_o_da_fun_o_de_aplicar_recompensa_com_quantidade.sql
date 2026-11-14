create or replace function public.aplicar_recompensa_da_cronica(p_character_id text, p_tipo text, p_valor numeric, p_quantidade numeric, p_item_id text, p_spell_id text, p_motivo text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_tenant uuid;
begin
  select c.tenant_id into v_tenant from public.characters c where c.id = p_character_id;
  if v_tenant is null then
    raise exception 'Personagem não encontrado.';
  end if;

  insert into public.fichas (character_id, tenant_id, created_by)
  values (p_character_id, v_tenant, auth.uid())
  on conflict (character_id) do nothing;

  if p_tipo = 'dinheiro' then
    perform public.creditar_dinheiro_na_ficha(p_character_id, coalesce(p_valor, 0));

  elsif p_tipo = 'xp' then
    perform public.creditar_xp_na_ficha(p_character_id, coalesce(p_valor, 0), coalesce(nullif(trim(p_motivo), ''), 'Recompensa de crônica'));

  elsif p_tipo = 'magia' then
    if p_spell_id is null then
      raise exception 'Recompensa de magia sem magia definida.';
    end if;
    insert into public.spell_progress (character_id, tenant_id, spell_id, learned)
    values (p_character_id, v_tenant, p_spell_id, true)
    on conflict (character_id, spell_id) do update set learned = true, updated_at = now();

  elsif p_tipo = 'item' then
    if p_item_id is null then
      raise exception 'Recompensa de item sem mercadoria definida.';
    end if;
    perform public.adicionar_item_na_ficha(p_character_id, p_item_id, greatest(1, coalesce(p_quantidade, 1)));

  else
    raise exception 'Tipo de recompensa inválido: %', p_tipo;
  end if;
end;
$function$