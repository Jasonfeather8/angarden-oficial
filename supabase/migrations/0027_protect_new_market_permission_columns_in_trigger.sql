create or replace function public.prevent_ficha_escalation()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  if not (public.is_mestre() or public.is_admin() or public.is_privileged()) then
    if new.edicao_liberada is distinct from old.edicao_liberada
       or new.acesso_mercado_epico is distinct from old.acesso_mercado_epico
       or new.acesso_mercado_arcano is distinct from old.acesso_mercado_arcano
       or new.acesso_mercado_lendario is distinct from old.acesso_mercado_lendario
       or new.pode_comprar is distinct from old.pode_comprar then
      raise exception 'Somente o Mestre da mesa pode alterar as permissões desta ficha.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$function$