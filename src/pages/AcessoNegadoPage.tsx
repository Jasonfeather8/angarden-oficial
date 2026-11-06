import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { PageShell } from '../components/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { ROUTES } from '../routes/paths';

export const AcessoNegadoPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageShell
      id="page-acesso-negado"
      variant="padrao"
      title={
        <h2 className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-[#e7b29e]" aria-hidden="true" />
          Acesso restrito
        </h2>
      }
      subtitle="Seu papel atual não permite abrir esta área"
    >
      <div className="mx-auto w-full max-w-[720px]">
        <EmptyState
          variant="plano"
          icon={<ShieldAlert className="h-8 w-8" aria-hidden="true" />}
          title="Permissão insuficiente"
          description="Esta tela é restrita a papéis específicos. Fale com o administrador da plataforma caso precise de acesso."
          action={
            <GothicButton size="sm" onClick={() => navigate(ROUTES.dashboard)}>
              Voltar ao Dashboard
            </GothicButton>
          }
        />
      </div>
    </PageShell>
  );
};

export default AcessoNegadoPage;
