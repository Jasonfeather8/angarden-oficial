import React from 'react';
import { Award, Coins, Lock, UserCog, Users } from 'lucide-react';
import { ToolbarButton } from '../ui/ToolbarButton';
import { TituloDeSecao } from './TituloDeSecao';

export interface AcoesDoMestrePanelProps {
  /** Quantas fichas têm permissões editadas e ainda não salvas. */
  alteracoesPendentes: number;
  onConcederXp: () => void;
  onDistribuirTesouro: () => void;
  onAbrirPermissoes: () => void;
  onAbrirGrimorio: () => void;
  onAbrirLimites: () => void;
}

/** Barra única de ações do Mestre sobre a mesa. */
export const AcoesDoMestrePanel: React.FC<AcoesDoMestrePanelProps> = ({
  alteracoesPendentes,
  onConcederXp,
  onDistribuirTesouro,
  onAbrirPermissoes,
  onAbrirGrimorio,
  onAbrirLimites,
}) => (
  <section aria-label="Ações do Mestre" className="space-y-3">
    <TituloDeSecao>Ações do Mestre</TituloDeSecao>
    <div className="flex flex-wrap items-center gap-2 rounded-sm border border-[#3a2c1d] bg-[#160f0a] p-2.5">
      <ToolbarButton
        id="btn-conceder-xp-conduta"
        variant="primary"
        icon={<Award className="h-3.5 w-3.5" />}
        onClick={onConcederXp}
      >
        Conceder XP
      </ToolbarButton>
      <ToolbarButton
        id="btn-distribuir-tesouro"
        icon={<Coins className="h-3.5 w-3.5" />}
        onClick={onDistribuirTesouro}
      >
        Distribuir tesouro
      </ToolbarButton>
      <span aria-hidden="true" className="mx-0.5 hidden h-6 w-px bg-[#3a2c1d] sm:block" />
      <ToolbarButton
        id="btn-gerenciar-jogadores-permissoes"
        icon={<Users className="h-3.5 w-3.5" />}
        onClick={onAbrirPermissoes}
      >
        Permissões
        {alteracoesPendentes > 0 && (
          <>
            <span aria-hidden="true" className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#8a4a2f] px-1 text-[9px] text-[#f3dfaa]">
              {alteracoesPendentes}
            </span>
            <span className="sr-only">
              {alteracoesPendentes === 1 ? '1 alteração não salva' : `${alteracoesPendentes} alterações não salvas`}
            </span>
          </>
        )}
      </ToolbarButton>
      <ToolbarButton
        id="btn-bloqueios-grimorio"
        icon={<Lock className="h-3.5 w-3.5" />}
        onClick={onAbrirGrimorio}
      >
        Grimório
      </ToolbarButton>
      <ToolbarButton
        id="btn-limite-fichas"
        icon={<UserCog className="h-3.5 w-3.5" />}
        onClick={onAbrirLimites}
      >
        Limites
      </ToolbarButton>
    </div>
  </section>
);

export default AcoesDoMestrePanel;
