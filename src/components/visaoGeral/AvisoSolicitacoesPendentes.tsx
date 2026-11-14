import React from 'react';
import { ScrollText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GothicButton } from '../GothicButton';
import { pluralizarSolicitacoes } from './formatters';
import { ROUTES } from '@/routes/paths';

interface AvisoSolicitacoesPendentesProps {
  quantidade: number;
}

export const AvisoSolicitacoesPendentes: React.FC<AvisoSolicitacoesPendentesProps> = ({ quantidade }) => {
  const navigate = useNavigate();

  if (quantidade === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border border-[#8c6b41] bg-[#241a11]/95 px-4 py-3">
      <p className="flex items-center gap-2 font-serif text-sm text-[#e6ddc5]">
        <ScrollText className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
        {quantidade} {pluralizarSolicitacoes(quantidade)} aguardando aprovação.
      </p>
      <GothicButton size="xs" onClick={() => navigate(ROUTES.admin.solicitacoes)}>
        Revisar agora
      </GothicButton>
    </div>
  );
};
