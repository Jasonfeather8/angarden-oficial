create table public.chronicle_rewards (
  id uuid primary key default gen_random_uuid(),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  objective_id uuid references public.chronicle_objectives(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  tipo text not null,
  descricao text not null default '',
  valor numeric not null default 0,
  item_id text references public.market_items(id) on delete set null,
  spell_id text references public.grimorio_spells(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chronicle_rewards_tipo_valido check (tipo in ('dinheiro','xp','magia','item')),
  constraint chronicle_rewards_valor_valido check (valor >= 0)
)