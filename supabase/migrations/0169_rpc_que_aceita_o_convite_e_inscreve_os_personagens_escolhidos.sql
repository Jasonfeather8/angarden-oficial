create or replace function public.accept_chronicle_invite(p_token text, p_character_ids text[])
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_invite public.chronicle_invites;
  v_cronica public.chronicles;
  v_jogador text;
  v_id text;
  v_nome text;
  v_total integer := 0;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado para aceitar um convite.';
  end if;
  if not (public.is_active() or public.is_admin()) then
    raise exception 'Sua conta ainda não foi aprovada pelo administrador.';
  end if;
  if coalesce(array_length(p_character_ids, 1), 0) = 0 then
    raise exception 'Escolha ao menos um personagem para participar.';
  end if;

  select * into v_invite from public.chronicle_invites i where i.token = trim(p_token);
  if v_invite.token is null then
    raise exception 'Convite inválido ou inexistente.';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Este convite expirou. Peça um novo link ao Mestre.';
  end if;

  select * into v_cronica from public.chronicles c where c.id = v_invite.chronicle_id;
  if v_cronica.id is null then
    raise exception 'A crônica deste convite não existe mais.';
  end if;

  select p.nome_completo into v_jogador from public.profiles p where p.id = auth.uid();

  foreach v_id in array p_character_ids loop
    select c.nome into v_nome
    from public.characters c
    where c.id = v_id and c.created_by = auth.uid();

    if v_nome is null then
      raise exception 'Personagem inválido: você só pode inscrever personagens seus.';
    end if;

    insert into public.chronicle_participants (chronicle_id, tenant_id, user_id, character_id, nome_personagem, nome_jogador, status)
    values (v_cronica.id, v_cronica.tenant_id, auth.uid(), v_id, v_nome, coalesce(v_jogador, ''), 'pendente')
    on conflict (chronicle_id, character_id) do update
      set nome_personagem = excluded.nome_personagem,
          nome_jogador = excluded.nome_jogador,
          status = case when public.chronicle_participants.status = 'aprovado' then 'aprovado' else 'pendente' end,
          updated_at = now();

    v_total := v_total + 1;
  end loop;

  return jsonb_build_object('chronicle_id', v_cronica.id, 'inscritos', v_total);
end;
$function$