alter table public.market_items
  add column if not exists busca text generated always as (public.f_unaccent(lower(
    coalesce(nome, '') || ' ' ||
    coalesce(categoria, '') || ' ' ||
    coalesce(material, '') || ' ' ||
    coalesce(efeito, '') || ' ' ||
    coalesce(dados ->> 'tipo', '')
  ))) stored;