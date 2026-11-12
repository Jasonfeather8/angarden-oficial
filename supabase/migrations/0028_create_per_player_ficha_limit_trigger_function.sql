create or replace function public.prevent_ficha_limit()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_limite integer;
  v_total integer;
begin
  new.created_by := coalesce(new.created_by, auth.uid());
  if new.created_by is null or public.is_admin() or public.is_privileged() then
    return new;
  end if;

  select p.limite_fichas into v_limite from public.profiles p where p.id = new.created_by;
  if v_limite is null then
    v_limite := 10;
  end if;

  select count(*) into v_total
  from public.characters c
  where c.tenant_id = new.tenant_id and c.created_by = new.created_by;

  if v_total >= v_limite then
    raise exception 'Limite de % fichas por jogador atingido. Peça ao Mestre da mesa para ampliar o limite.', v_limite;
  end if;
  return new;
end;
$function$