create or replace function public.prevent_profile_escalation()
 returns trigger
 language plpgsql
 security definer
 set search_path to ''
as $function$
begin
  if not (public.is_admin() or public.is_privileged()) then
    if new.role is distinct from old.role
       or new.status is distinct from old.status
       or new.tenant_id is distinct from old.tenant_id
       or new.motivo_recusa is distinct from old.motivo_recusa
       or new.email is distinct from old.email then
      raise exception 'Alteração de papel, situação, email ou cliente é restrita ao administrador da plataforma.';
    end if;
    if not public.is_mestre() and new.limite_fichas is distinct from old.limite_fichas then
      raise exception 'Somente o Mestre da mesa pode definir o limite de fichas.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$function$