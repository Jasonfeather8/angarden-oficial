import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { PageShell } from '../components/PageShell';
import { EmptyState } from '../components/ui/EmptyState';
import { ROUTES } from '../routes/paths';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageShell
      id="page-not-found"
      variant="padrao"
      title={
        <h2 className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
          Rota não encontrada
        </h2>
      }
      subtitle="Os mapas do reino não registram este caminho"
    >
      <div className="mx-auto w-full max-w-[720px]">
        <EmptyState
          variant="plano"
          icon={<Compass className="h-8 w-8" aria-hidden="true" />}
          title="Página inexistente"
          description="O endereço acessado não corresponde a nenhuma tela do sistema Angarden."
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

export default NotFoundPage;
