create or replace function public.pode_escrever_midia(p_pasta text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  -- O serviço de Storage não entrega os claims do token para auth.jwt(), então
  -- is_admin()/current_tenant_id() não funcionam dentro das políticas de storage.
  -- Aqui o papel e o cliente são resolvidos pela conta autenticada (auth.uid)
  -- em profiles, que é a fonte autoritativa definida na aprovação da conta.
  -- A pasta raiz do caminho precisa ser o cliente do usuário, o próprio usuário,
  -- ou qualquer pasta quando ele é o administrador da plataforma.
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.status = 'ativo'
      and (
        p.role = 'admin'
        or p_pasta = p.id::text
        or (p.tenant_id is not null and p_pasta = p.tenant_id::text)
      )
  )
$$