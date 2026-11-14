import React from 'react';
import { Crown, UserCheck } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { FormularioDePerfil } from '@/components/perfil/FormularioDePerfil';
import { usePerfilForm } from '@/components/perfil/usePerfilForm';
import { useSessaoDoPerfil } from '@/components/perfil/useSessaoDoPerfil';

/**
 * Meu Perfil & Configurações: os dados cadastrais, a foto e a troca de senha da
 * conta autenticada. A sessão e o papel vêm de `useSessaoDoPerfil` e o
 * formulário de `usePerfilForm`; aqui só se compõe a tela.
 */
export const PerfilPage: React.FC = () => {
  const sessao = useSessaoDoPerfil();
  const form = usePerfilForm({ user: sessao.user, applyUser: sessao.applyUser });

  if (!sessao.user) return null;

  return (
    <PageShell
      id="page-perfil"
      variant="padrao"
      title={
        <h2 className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#a88d61]" />
          Meu Perfil & Configurações
        </h2>
      }
      subtitle="Gerenciamento de credenciais, dados cadastrais e preferências"
      headerRight={
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#8c6b41]/70 bg-[#2a1d10]/80 px-2.5 py-1 text-xs font-cinzel uppercase tracking-wider text-[#d4af37]">
          {sessao.isMestre ? <Crown className="h-3.5 w-3.5" aria-hidden="true" /> : <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />}
          {sessao.papel}
        </span>
      }
    >
      <div className="mx-auto w-full max-w-[720px] space-y-6">
        <FormularioDePerfil usuario={sessao.user} iniciais={sessao.iniciais} form={form} onSair={sessao.sair} />
      </div>
    </PageShell>
  );
};

export default PerfilPage;
