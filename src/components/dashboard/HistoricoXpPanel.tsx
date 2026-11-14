import React from 'react';
import { Award, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import { fichaPath, ROUTES } from '../../routes/paths';
import type { MesaResumo, XpLog } from '../../services/fichaService';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { Skeleton } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { formatarNumero, formatarQuando } from './formatters';

export interface HistoricoXpPanelProps {
  papelMestre: boolean;
  userId: string | null;
  nomesPorFicha: Map<string, string>;
  nomesPorJogador: Map<string, string>;
  historicoQuery: UseAsyncDataResult<XpLog[]>;
  resumoQuery: UseAsyncDataResult<MesaResumo[]>;
}

/** Últimas concessões de XP da mesa, com autor e personagem. */
export const HistoricoXpPanel: React.FC<HistoricoXpPanelProps> = ({
  papelMestre,
  userId,
  nomesPorFicha,
  nomesPorJogador,
  historicoQuery,
  resumoQuery,
}) => {
  const navigate = useNavigate();

  return (
    <PainelSecao
      id="historico-xp-titulo"
      icon={<Sparkles className="h-4 w-4" aria-hidden="true" />}
      title="Histórico de XP"
      hint={papelMestre ? 'recompensas da mesa' : 'suas recompensas'}
      contentClassName="p-3.5"
      extra={
        papelMestre ? (
          <ToolbarButton
            icon={<Award className="h-3.5 w-3.5" aria-hidden="true" />}
            onClick={() => navigate(ROUTES.painelMestre)}
          >
            Conceder XP
          </ToolbarButton>
        ) : undefined
      }
    >
      {historicoQuery.isLoading || resumoQuery.isLoading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Carregando o histórico de XP…</span>
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : historicoQuery.error || resumoQuery.error ? (
        <ErrorState
          description={historicoQuery.error ?? resumoQuery.error ?? ''}
          onRetry={() => {
            historicoQuery.reload();
            resumoQuery.reload();
          }}
        />
      ) : (historicoQuery.data ?? []).length === 0 ? (
        <EmptyState
          variant="plano"
          icon={<Sparkles className="h-8 w-8" aria-hidden="true" />}
          title="Sem recompensas ainda"
          description={
            papelMestre
              ? 'Quando você conceder XP, o registro aparecerá aqui.'
              : 'As recompensas concedidas pelo Mestre aparecerão aqui.'
          }
        />
      ) : (
        <ul className="space-y-2">
          {(historicoQuery.data ?? []).map((entrada) => {
            const nome = nomesPorFicha.get(entrada.characterId) ?? 'Aventureiro';
            const autor =
              entrada.grantedBy === userId
                ? 'você'
                : entrada.grantedBy
                  ? nomesPorJogador.get(entrada.grantedBy)
                  : undefined;
            const quando = formatarQuando(entrada.createdAt);
            return (
              <li key={entrada.id}>
                <Link
                  to={fichaPath(entrada.characterId)}
                  className="block rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-2.5 py-2.5 transition-colors hover:border-[#5a4225] hover:bg-[#1b120b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba]">{nome}</span>
                    <span className="shrink-0 font-cinzel text-[11px] font-bold text-[#e0c98e]">+{formatarNumero(entrada.amount)} XP</span>
                  </span>
                  <span className="mt-1 block font-serif text-[12px] leading-snug text-[#d6c4ae]">{entrada.reason}</span>
                  <span className="mt-0.5 block font-serif text-[10px] text-[#8f795e]">
                    {quando}
                    {papelMestre && autor ? ` · por ${autor}` : ''}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </PainelSecao>
  );
};

export default HistoricoXpPanel;
