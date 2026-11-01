import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { GothicButton } from '../components/GothicButton';
import { MedievalFrame } from '../components/MedievalFrame';
import { EmptyState } from '../components/ui/EmptyState';
import { ROUTES } from '../routes/paths';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div id="page-not-found" className="w-full max-w-[720px] mx-auto">
      <MedievalFrame
        title={
          <h2 className="flex items-center gap-2 font-cinzel text-xl font-bold uppercase tracking-wider text-[#e6ddc5]">
            <Compass className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
            Rota não encontrada
          </h2>
        }
        subtitle="Os mapas do reino não registram este caminho"
      >
        <EmptyState
          icon={<Compass className="h-8 w-8" aria-hidden="true" />}
          title="Página inexistente"
          description="O endereço acessado não corresponde a nenhuma tela do sistema Angarden."
          className="border-none bg-transparent px-0 py-6 shadow-none"
          action={
            <GothicButton size="sm" onClick={() => navigate(ROUTES.dashboard)}>
              Voltar ao Dashboard
            </GothicButton>
          }
        />
      </MedievalFrame>
    </div>
  );
};

export default NotFoundPage;
