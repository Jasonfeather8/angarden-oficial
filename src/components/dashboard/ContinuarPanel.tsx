import React from 'react';
import { Bookmark, ScrollText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import { fichaPath } from '../../routes/paths';
import type { MesaResumo } from '../../services/fichaService';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { Skeleton } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { formatarNumero } from './formatters';

export interface ContinuarPanelProps {
  resumoQuery: UseAsyncDataResult<MesaResumo[]>;
  continuar: MesaResumo | null;
}

/** Retoma a última ficha aberta (ou a única do jogador). */
export const ContinuarPanel: React.FC<ContinuarPanelProps> = ({ resumoQuery, continuar }) => {
  const navigate = useNavigate();

  return (
    <PainelSecao
      id="continuar-titulo"
      icon={<Bookmark className="h-4 w-4" />}
      title="Continuar de onde parei"
      contentClassName="p-3.5"
    >
      {resumoQuery.isLoading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Carregando o último personagem…</span>
          <Skeleton className="h-20 w-full" />
        </div>
      ) : resumoQuery.error ? (
        <ErrorState description={resumoQuery.error} onRetry={resumoQuery.reload} />
      ) : continuar ? (
        <div className="space-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-[#5a4225] bg-[#241a11]">
              {continuar.imagemUrl ? (
                <img src={continuar.imagemUrl} alt={`Retrato de ${continuar.nome}`} className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden="true" className="font-cinzel text-lg font-bold text-[#c6a66d]">{continuar.nome.trim().charAt(0).toUpperCase() || '?'}</span>
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate font-cinzel text-sm font-bold text-[#e6ddc5]">{continuar.nome}</p>
              <p className="font-serif text-[11px] text-[#a88d61]">Nível {continuar.nivel} · {formatarNumero(continuar.xp)} XP</p>
            </div>
          </div>
          <ToolbarButton
            variant="primary"
            className="w-full justify-center"
            icon={<ScrollText className="h-3.5 w-3.5" />}
            onClick={() => navigate(fichaPath(continuar.id))}
            aria-label={`Abrir ficha de ${continuar.nome}`}
          >
            Abrir ficha
          </ToolbarButton>
        </div>
      ) : (
        <p className="font-serif text-xs text-[#8f795e]">Abra uma ficha e ela ficará aqui para retomar a jornada.</p>
      )}
    </PainelSecao>
  );
};

export default ContinuarPanel;
