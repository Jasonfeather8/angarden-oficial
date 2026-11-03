alter table public.grimorio_spells
  add column if not exists nome text generated always as (dados ->> 'name') stored,
  add column if not exists escola text generated always as (dados ->> 'schoolId') stored,
  add column if not exists nivel text generated always as (dados ->> 'level') stored,
  add column if not exists tipo text generated always as (dados ->> 'type') stored,
  add column if not exists busca text generated always as (public.f_unaccent(lower(
    coalesce(dados ->> 'name', '') || ' ' ||
    coalesce(dados ->> 'type', '') || ' ' ||
    coalesce(dados ->> 'level', '') || ' ' ||
    coalesce(dados ->> 'schoolId', '') || ' ' ||
    coalesce(dados ->> 'subcategory', '') || ' ' ||
    coalesce(dados ->> 'magicalEffects', '') || ' ' ||
    coalesce(dados ->> 'description', '')
  ))) stored;