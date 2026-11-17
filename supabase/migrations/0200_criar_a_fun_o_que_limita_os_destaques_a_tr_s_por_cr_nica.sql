create or replace function public.prevent_destaque_limit() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.destaque then
    if (select count(*) from public.chronicle_rewards r where r.chronicle_id = new.chronicle_id and r.destaque and r.id <> new.id) >= 3 then
      raise exception 'Uma crônica aceita no máximo três mercadorias em destaque.';
    end if;
  end if;
  return new;
end;
$$;