create or replace function public.pode_gerir_biblioteca()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- Mesma limitação do helper de leitura: o papel vem de profiles por auth.uid(),
  -- e não de is_admin(), que depende dos claims do token. O acervo da Biblioteca
  -- é catálogo da plataforma: só o Administrador escreve.
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'ativo'
      and p.role = 'admin'
  )
$$;