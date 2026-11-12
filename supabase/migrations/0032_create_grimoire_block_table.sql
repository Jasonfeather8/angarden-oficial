create table if not exists public.grimorio_bloqueios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  escola_id text,
  volume_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  constraint grimorio_bloqueios_alvo_check check ((escola_id is null) <> (volume_id is null))
)