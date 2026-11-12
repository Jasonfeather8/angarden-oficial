create or replace function public.distribute_treasure(p_character_ids text[], p_deltas numeric[])
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_quantidade integer := coalesce(array_length(p_character_ids, 1), 0);
  v_tenant uuid;
  v_nome text;
  v_atual numeric;
  v_novo numeric;
  v_total numeric := 0;
  i integer;
begin
  if v_quantidade = 0 then
    raise exception 'Selecione ao menos um personagem.';
  end if;
  if coalesce(array_length(p_deltas, 1), 0) <> v_quantidade then
    raise exception 'A quantidade de valores não confere com a de personagens.';
  end if;

  for i in 1 .. v_quantidade loop
    if p_character_ids[i] is null or trim(p_character_ids[i]) = '' then
      raise exception 'Personagem inválido na distribuição.';
    end if;
    if p_deltas[i] is null or p_deltas[i] = 0 then
      raise exception 'Informe um valor de ajuste diferente de zero.';
    end if;

    select c.tenant_id, c.nome into v_tenant, v_nome
    from public.characters c
    where c.id = p_character_ids[i];

    if v_tenant is null then
      raise exception 'Personagem não encontrado.';
    end if;
    if not (public.is_admin() or public.is_privileged() or (public.is_mestre() and v_tenant = public.current_tenant_id())) then
      raise exception 'Sem permissão para ajustar o tesouro desta ficha.';
    end if;

    insert into public.fichas (character_id, tenant_id, created_by)
    values (p_character_ids[i], v_tenant, auth.uid())
    on conflict (character_id) do nothing;

    select coalesce(public.safe_numeric(f.dados -> 'recursos' ->> 'dinheiro'), 0) into v_atual
    from public.fichas f
    where f.character_id = p_character_ids[i];

    v_novo := v_atual + p_deltas[i];
    if v_novo < 0 then
      raise exception 'O tesouro de % ficaria negativo (saldo atual: %).', v_nome, v_atual;
    end if;

    update public.fichas
    set dados = jsonb_set(dados, '{recursos,dinheiro}', to_jsonb(v_novo), true)
    where character_id = p_character_ids[i];

    v_total := v_total + p_deltas[i];
  end loop;

  return jsonb_build_object('fichas', v_quantidade, 'total', v_total);
end;
$function$