create table public.chronicle_objectives (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  titulo text not null,
  concluido boolean not null default false,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)