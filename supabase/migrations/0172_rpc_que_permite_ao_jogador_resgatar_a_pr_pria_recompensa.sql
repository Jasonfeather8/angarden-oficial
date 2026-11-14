create or replace function public.claim_chronicle_reward(p_reward_id uuid, p_character_id text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_recompensa public.chronicle_rewards;
  v_cronica public.chronicles;
  v_objetivo public.chronicle_objectives;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado para resgatar uma recompensa.';
  end if;

  select * into v_recompensa from public.chronicle_rewards r where r.id = p_reward_id;
  if v_recompensa.id is null then
    raise exception 'Recompensa não encontrada.';
  end if;

  select * into v_cronica from public.chronicles c where c.id = v_recompensa.chronicle_id;

  if not exists (
    select 1 from public.characters c where c.id = p_character_id and c.created_by = auth.uid()
  ) then
    raise exception 'Você só pode resgatar recompensas para os seus personagens.';
  end if;

  if not exists (
    select 1 from public.chronicle_participants p
    where p.chronicle_id = v_recompensa.chronicle_id
      and p.character_id = p_character_id
      and p.user_id = auth.uid()
      and p.status = 'aprovado'
  ) then
    raise exception 'Este personagem não está aprovado nesta crônica.';
  end if;

  if v_recompensa.objective_id is not null then
    select * into v_objetivo from public.chronicle_objectives o where o.id = v_recompensa.objective_id;
    if not coalesce(v_objetivo.concluido, false) then
      raise exception 'O objetivo desta recompensa ainda não foi concluído.';
    end if;
  elsif v_cronica.status <> 'CONCLUIDA' then
    raise exception 'A recompensa final é liberada quando o Mestre concluir a crônica.';
  end if;

  insert into public.chronicle_reward_grants (reward_id, character_id, tenant_id, origem, granted_by)
  values (p_reward_id, p_character_id, v_recompensa.tenant_id, 'resgate', auth.uid())
  on conflict (reward_id, character_id) do nothing;

  if not found then
    raise exception 'Esta recompensa já foi recebida por este personagem.';
  end if;

  perform public.aplicar_recompensa_da_cronica(p_character_id, v_recompensa.tipo, v_recompensa.valor, v_recompensa.item_id, v_recompensa.spell_id, v_cronica.titulo);

  return jsonb_build_object('character_id', p_character_id, 'tipo', v_recompensa.tipo);
end;
$function$