create or replace function public.grant_chronicle_reward(p_reward_id uuid, p_character_ids text[])
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_recompensa public.chronicle_rewards;
  v_cronica public.chronicles;
  v_id text;
  v_entregues integer := 0;
begin
  select * into v_recompensa from public.chronicle_rewards r where r.id = p_reward_id;
  if v_recompensa.id is null then
    raise exception 'Recompensa não encontrada.';
  end if;
  if not public.pode_gerir_cronica(v_recompensa.chronicle_id) then
    raise exception 'Apenas o Mestre que criou a crônica pode entregar recompensas.';
  end if;
  if coalesce(array_length(p_character_ids, 1), 0) = 0 then
    raise exception 'Escolha ao menos um personagem para receber a recompensa.';
  end if;

  select * into v_cronica from public.chronicles c where c.id = v_recompensa.chronicle_id;

  foreach v_id in array p_character_ids loop
    if not exists (
      select 1 from public.chronicle_participants p
      where p.chronicle_id = v_recompensa.chronicle_id
        and p.character_id = v_id
        and p.status = 'aprovado'
    ) then
      raise exception 'Só é possível entregar recompensas a personagens aprovados nesta crônica.';
    end if;

    insert into public.chronicle_reward_grants (reward_id, character_id, tenant_id, origem, granted_by)
    values (p_reward_id, v_id, v_recompensa.tenant_id, 'mestre', auth.uid())
    on conflict (reward_id, character_id) do nothing;

    if found then
      perform public.aplicar_recompensa_da_cronica(v_id, v_recompensa.tipo, v_recompensa.valor, v_recompensa.quantidade, v_recompensa.item_id, v_recompensa.spell_id, v_cronica.titulo);
      v_entregues := v_entregues + 1;
    end if;
  end loop;

  return jsonb_build_object('entregues', v_entregues);
end;
$function$