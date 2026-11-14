create or replace function public.get_chronicle_invite_preview(p_token text)
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_invite public.chronicle_invites;
  v_cronica public.chronicles;
  v_cliente text;
  v_mestre text;
begin
  if auth.uid() is null then
    raise exception 'É necessário estar autenticado para ver o convite.';
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

  select t.nome into v_cliente from public.tenants t where t.id = v_cronica.tenant_id;
  select p.nome_completo into v_mestre from public.profiles p where p.id = v_cronica.created_by;

  return jsonb_build_object(
    'chronicle_id', v_cronica.id,
    'titulo', v_cronica.titulo,
    'data_aventura', v_cronica.data_aventura,
    'local', v_cronica.local,
    'relato', left(coalesce(v_cronica.relato, ''), 400),
    'cliente', coalesce(v_cliente, ''),
    'mestre', coalesce(v_mestre, ''),
    'ja_participa', exists (
      select 1 from public.chronicle_participants p
      where p.chronicle_id = v_cronica.id and p.user_id = auth.uid()
    )
  );
end;
$function$