create table public.chronicle_invites (
  token text primary key default replace(gen_random_uuid()::text, '-', ''),
  chronicle_id uuid not null references public.chronicles(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
)