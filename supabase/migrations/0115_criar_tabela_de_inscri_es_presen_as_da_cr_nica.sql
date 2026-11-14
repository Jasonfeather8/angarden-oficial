create table public.chronicle_participants (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  character_id text not null references public.characters(id) on delete cascade,
  nome_personagem text not null default '',
  nome_jogador text not null default '',
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chronicle_participants_status_valido check (status in ('pendente','aprovado','recusado'))
)