create table public.chronicle_reward_grants (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.chronicle_rewards(id) on delete cascade,
  character_id text not null references public.characters(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  origem text not null default 'mestre',
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chronicle_reward_grants_origem_valida check (origem in ('mestre','resgate'))
)