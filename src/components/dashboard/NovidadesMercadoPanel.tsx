import React from 'react';
import { Coins, ShoppingBag, Store } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import { ROUTES } from '../../routes/paths';
import type { NovidadeMercado } from '../../services/mercadoService';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { Skeleton } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { formatarNumero, formatarQuando } from './formatters';

export interface NovidadesMercadoPanelProps {
  novidadesQuery: UseAsyncDataResult<NovidadeMercado[]>;
}

/** Últimas mercadorias publicadas no catálogo global. */
export const NovidadesMercadoPanel: React.FC<NovidadesMercadoPanelProps> = ({ novidadesQuery }) => {
  const navigate = useNavigate();

  return (
    <PainelSecao
      id="mercado-titulo"
      icon={<Store className="h-4 w-4" aria-hidden="true" />}
      title="Novidades do Mercado"
      hint="últimas mercadorias do catálogo"
      contentClassName="p-4"
      extra={
        <ToolbarButton
          icon={<ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={() => navigate(ROUTES.mercado)}
        >
          Ver Mercado
        </ToolbarButton>
      }
    >
      {novidadesQuery.isLoading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Carregando as novidades do Mercado…</span>
          <div className="space-y-2">
            <Skeleton className="h-[60px] w-full" />
            <Skeleton className="h-[60px] w-full" />
            <Skeleton className="h-[60px] w-full" />
          </div>
        </div>
      ) : novidadesQuery.error ? (
        <ErrorState description={novidadesQuery.error} onRetry={novidadesQuery.reload} />
      ) : (novidadesQuery.data ?? []).length === 0 ? (
        <EmptyState
          variant="plano"
          icon={<Store className="h-8 w-8" aria-hidden="true" />}
          title="Catálogo vazio"
          description="As mercadorias cadastradas no Mercado aparecerão aqui."
        />
      ) : (
        <ul className="space-y-2">
          {(novidadesQuery.data ?? []).map((novidade) => {
            const { item } = novidade;
            return (
              <li key={item.id} className="flex items-start gap-3 rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-3 py-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xs border border-[#5a4225] bg-[#241a11]">
                  {item.imagem_url ? (
                    <img src={item.imagem_url} alt={`Imagem de ${item.nome}`} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <Store className="h-4 w-4 text-[#c6a66d]" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba]">{item.nome}</p>
                    <span className="flex shrink-0 items-center gap-1 font-serif text-[11px] text-[#d8b86b]">
                      <Coins className="h-3 w-3" aria-hidden="true" />
                      {formatarNumero(item.preco)}
                      <span className="sr-only">moedas</span>
                    </span>
                  </div>
                  <p className="mt-0.5 font-serif text-[11px] italic text-[#8f795e]">
                    {item.is_epico ? 'Épico · ' : ''}
                    {item.subcategoria || item.tipo || 'Mercadoria'} · {formatarQuando(novidade.criadoEm)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PainelSecao>
  );
};

export default NovidadesMercadoPanel;
