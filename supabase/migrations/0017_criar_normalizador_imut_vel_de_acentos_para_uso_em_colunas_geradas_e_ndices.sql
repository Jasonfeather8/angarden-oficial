create or replace function public.f_unaccent(p_texto text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, pg_catalog
as $$ select public.unaccent(p_texto) $$;