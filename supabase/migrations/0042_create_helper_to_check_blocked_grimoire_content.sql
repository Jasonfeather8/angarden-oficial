create or replace function public.grimorio_conteudo_bloqueado(p_volume_id text, p_escola_id text)
 returns boolean
 language sql
 stable
 security definer
 set search_path to ''
as $function$
  select exists (
    select 1
    from public.grimorio_bloqueios b
    where b.tenant_id = public.current_tenant_id()
      and (b.volume_id = p_volume_id or b.escola_id = p_escola_id)
  );
$function$