import React from 'react';
import { CheckCircle2, ChevronRight, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { Skeleton } from '../ui/Skeleton';
import type { Pendencia } from './usePendenciasDaMesa';

export interface PendenciasPanelProps {
  papelMestre: boolean;
  pendencias: Pendencia[];
  carregando: boolean;
  erro: string | null;
  recarregar: () => void;
}

/** Lista de pendências da mesa, já derivada pelo hook conforme o papel. */
export const PendenciasPanel: React.FC<PendenciasPanelProps> = ({
  papelMestre,
  pendencias,
  carregando,
  erro,
  recarregar,
}) => (
  <PainelSecao
    id="pendencias-titulo"
    icon={<ListChecks className="h-4 w-4" />}
    title="Pendências"
    contentClassName="p-3.5"
  >
    {carregando ? (
      <div role="status" aria-live="polite">
        <span className="sr-only">Carregando as pendências…</span>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    ) : erro ? (
      <ErrorState description={erro} onRetry={recarregar} />
    ) : pendencias.length ? (
      <ul className="space-y-2">
        {pendencias.map((pendencia) => (
          <li key={pendencia.id} className="flex items-start gap-2.5 rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-2.5 py-2.5">
            <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-[#4b3823] bg-[#1d140c] text-[#d1a85a]">{pendencia.icon}</span>
            <div className="min-w-0">
              <p className="font-serif text-[13px] leading-snug text-[#d6c4ae]">{pendencia.texto}</p>
              <Link to={pendencia.to} className="mt-1 inline-flex items-center gap-1 font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#d1a85a] hover:text-[#f0d79b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]">
                {pendencia.acao}
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <EmptyState
        variant="plano"
        icon={<CheckCircle2 className="h-8 w-8" />}
        title="Nada pendente"
        description={papelMestre ? 'A mesa está em ordem.' : 'Suas fichas estão em ordem.'}
      />
    )}
  </PainelSecao>
);

export default PendenciasPanel;
