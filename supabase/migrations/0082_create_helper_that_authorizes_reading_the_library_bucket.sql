create or replace function public.pode_ler_biblioteca()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- O serviço de Storage não entrega os claims do token para auth.jwt(), então
  -- is_active() não funciona dentro das políticas de storage: a situação da
  -- conta é resolvida por auth.uid() em profiles, que é a fonte autoritativa
  -- definida na aprovação da conta.
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'ativo'
  )
$$;