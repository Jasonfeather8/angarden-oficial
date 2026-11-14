create or replace function public.add_chronicle_participant(p_chronicle_id uuid, p_character_id text, p_status text default 'aprovado')
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_cronica public.chronicles;
  v_personagem public.characters;
  v_jogador text;
  v_id uuid;
begin
  if p_status not in ('pendente', 'aprovado', 'recusado') then
    raise exception 'Situação de inscrição inválida: %', p_status;
  end if;

  select * into v_cronica from public.chronicles c where c.id = p_chronicle_id;
  if v_cronica.id is null then
    raise exception 'Crônica não encontrada.';
  end if;
  if not public.pode_gerir_cronica(p_chronicle_id) then
    raise exception 'Apenas o Mestre que criou a crônica pode inscrever personagens.';
  end if;

  select * into v_personagem from public.characters c where c.id = p_character_id;
  if v_personagem.id is null then
    raise exception 'Personagem não encontrado.';
  end if;

  select p.nome_completo into v_jogador from public.profiles p where p.id = v_personagem.created_by;

  insert into public.chronicle_participants (chronicle_id, tenant_id, user_id, character_id, nome_personagem, nome_jogador, status)
  values (
    p_chronicle_id,
    v_cronica.tenant_id,
    coalesce(v_personagem.created_by, auth.uid()),
    p_character_id,
    v_personagem.nome,
    coalesce(v_jogador, ''),
    p_status
  )
  on conflict (chronicle_id, character_id) do update
    set nome_personagem = excluded.nome_personagem,
        nome_jogador = excluded.nome_jogador,
        status = excluded.status,
        updated_at = now()
  returning id into v_id;

  return v_id;
end;
$function$