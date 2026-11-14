create table public.chronicle_notes (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  autor_id uuid references public.profiles(id) on delete set null,
  titulo text not null default '',
  conteudo text not null default '',
  visivel_jogadores boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
)