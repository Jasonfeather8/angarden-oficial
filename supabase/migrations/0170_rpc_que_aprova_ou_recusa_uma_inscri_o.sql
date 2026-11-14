create or replace function public.set_chronicle_participant_status(p_participant_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_participante public.chronicle_participants;
begin
  if p_status not in ('pendente', 'aprovado', 'recusado') then
    raise exception 'Situação de inscrição inválida: %', p_status;
  end if;

  select * into v_participante from public.chronicle_participants p where p.id = p_participant_id;
  if v_participante.id is null then
    raise exception 'Inscrição não encontrada.';
  end if;
  if not public.pode_gerir_cronica(v_participante.chronicle_id) then
    raise exception 'Apenas o Mestre que criou a crônica pode aprovar inscrições.';
  end if;

  update public.chronicle_participants
  set status = p_status, updated_at = now()
  where id = p_participant_id;
end;
$function$