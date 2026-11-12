alter table public.fichas
  add column if not exists pode_comprar boolean not null default true,
  add column if not exists acesso_mercado_arcano boolean not null default true,
  add column if not exists acesso_mercado_lendario boolean not null default false