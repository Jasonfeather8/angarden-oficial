import React from 'react';
import { CalendarClock, History } from 'lucide-react';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import type { SessaoDaMesa } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { Skeleton } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { formatarQuando } from './formatters';

export interface HistoricoSessoesPanelProps {
  isMestre: boolean;
  /** O Mestre só agenda outra quando já existe uma próxima sessão carregada. */
  podeAgendarOutra: boolean;
  historicoQuery: UseAsyncDataResult<SessaoDaMesa[]>;
  onAgendar: () => void;
}

/** Sessões já vividas pela mesa, da mais recente para a mais antiga. */
export const HistoricoSessoesPanel: React.FC<HistoricoSessoesPanelProps> = ({
  isMestre,
  podeAgendarOutra,
  historicoQuery,
  onAgendar,
}) => (
  <PainelSecao
    id="historico-sessoes-titulo"
    icon={<History className="h-4 w-4" aria-hidden="true" />}
    title="Histórico de sessões"
    hint="aventuras já vividas pela mesa"
    contentClassName="p-4"
    extra={
      isMestre && podeAgendarOutra ? (
        <ToolbarButton icon={<CalendarClock className="h-3.5 w-3.5" />} onClick={onAgendar}>
          Agendar outra
        </ToolbarButton>
      ) : undefined
    }
  >
    {historicoQuery.isLoading ? (
      <div role="status" aria-live="polite">
        <span className="sr-only">Carregando o histórico de sessões…</span>
        <div className="space-y-2">
          <Skeleton className="h-[68px] w-full" />
          <Skeleton className="h-[68px] w-full" />
          <Skeleton className="h-[68px] w-full" />
        </div>
      </div>
    ) : historicoQuery.error ? (
      <ErrorState description={historicoQuery.error} onRetry={historicoQuery.reload} />
    ) : (historicoQuery.data ?? []).length === 0 ? (
      <EmptyState
        variant="plano"
        icon={<History className="h-8 w-8" aria-hidden="true" />}
        title="Ainda não há sessões no histórico"
        description={
          isMestre
            ? 'A sessão entra aqui quando acontecer, com título e pauta.'
            : 'As sessões que a mesa jogou aparecerão aqui.'
        }
      />
    ) : (
      <ul className="space-y-2">
        {(historicoQuery.data ?? []).map((sessao, index) => (
          <li key={sessao.id} className="rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-3 py-2.5">
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba]">{sessao.titulo}</p>
              {index === 0 && (
                <span className="shrink-0 rounded-xs border border-[#5a4225] px-1.5 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-[#d8b86b]">
                  Última sessão
                </span>
              )}
            </div>
            <p className="mt-1 font-serif text-[11px] text-[#d8b86b]">{formatarQuando(sessao.dataHora)}</p>
            <p className="mt-0.5 line-clamp-2 font-serif text-[11px] italic text-[#8f795e]">{sessao.pauta}</p>
          </li>
        ))}
      </ul>
    )}
  </PainelSecao>
);

export default HistoricoSessoesPanel;
