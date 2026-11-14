create or replace function public.create_chronicle_invite(p_chronicle_id uuid)
returns public.chronicle_invites
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_invite public.chronicle_invites;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado.';
  end if;
  if not public.pode_gerir_cronica(p_chronicle_id) then
    raise exception 'Apenas o Mestre que criou a crônica pode gerar o convite.';
  end if;

  insert into public.chronicle_invites (chronicle_id, created_by)
  values (p_chronicle_id, auth.uid())
  returning * into v_invite;

  return v_invite;
end;
$function$