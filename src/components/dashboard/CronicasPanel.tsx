import React from 'react';
import { ScrollText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import { cronicaPath, ROUTES } from '../../routes/paths';
import type { Cronica } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { Skeleton } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { formatSessionDate } from './formatters';

export interface CronicasPanelProps {
  papelMestre: boolean;
  cronicasQuery: UseAsyncDataResult<Cronica[]>;
}

/** Os relatos mais recentes da mesa. */
export const CronicasPanel: React.FC<CronicasPanelProps> = ({ papelMestre, cronicasQuery }) => {
  const navigate = useNavigate();

  return (
    <PainelSecao
      id="cronicas-titulo"
      icon={<ScrollText className="h-4 w-4" aria-hidden="true" />}
      title="Crônicas recentes"
      hint="relatos da mesa"
      contentClassName="p-4"
      extra={
        <ToolbarButton
          icon={<ScrollText className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => navigate(ROUTES.cronicas)}
        >
          Ver Crônicas
        </ToolbarButton>
      }
    >
      {cronicasQuery.isLoading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Carregando as crônicas recentes…</span>
          <div className="space-y-2">
            <Skeleton className="h-[60px] w-full" />
            <Skeleton className="h-[60px] w-full" />
            <Skeleton className="h-[60px] w-full" />
          </div>
        </div>
      ) : cronicasQuery.error ? (
        <ErrorState description={cronicasQuery.error} onRetry={cronicasQuery.reload} />
      ) : (cronicasQuery.data ?? []).length === 0 ? (
        <EmptyState
          variant="plano"
          icon={<ScrollText className="h-8 w-8" aria-hidden="true" />}
          title="Ainda não há crônicas"
          description={
            papelMestre
              ? 'Registre o primeiro relato na tela de Crônicas para guardar as memórias da mesa.'
              : 'O relato aparecerá aqui quando a primeira sessão for narrada.'
          }
        />
      ) : (
        <ul className="space-y-2">
          {(cronicasQuery.data ?? []).slice(0, 3).map((cronica) => (
            <li key={cronica.id}>
              <Link
                to={cronicaPath(cronica.id)}
                className="flex items-start gap-3 rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-3 py-2.5 transition-colors hover:border-[#5a4225] hover:bg-[#1b120b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-[#5a4225] bg-[#241a11]">
                  {cronica.capaUrl ? (
                    <img src={cronica.capaUrl} alt={`Capa da crônica ${cronica.titulo}`} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <ScrollText className="h-4 w-4 text-[#c6a66d]" aria-hidden="true" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="min-w-0 truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba]">{cronica.titulo}</span>
                    {cronica.status === 'AGENDADA' && (
                      <span className="shrink-0 rounded-xs border border-[#5a4225] px-1.5 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-[#d8b86b]">
                        Agendada{cronica.agendadaPara ? ` · ${formatSessionDate(cronica.agendadaPara)}` : ''}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block font-serif text-[11px] text-[#d8b86b]">
                    {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${cronica.dataAventura}T00:00:00Z`))}
                  </span>
                  <span className="mt-0.5 line-clamp-2 font-serif text-[11px] italic text-[#8f795e]">{cronica.relato}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PainelSecao>
  );
};

export default CronicasPanel;
