import React from 'react';
import { Wand2 } from 'lucide-react';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import type { MesaResumo } from '../../services/fichaService';
import type { ProgressoArcanoFicha } from '../../services/grimorioService';
import { BarraProgresso } from '../ui/BarraProgresso';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { Skeleton } from '../ui/Skeleton';
import type { CatalogoDoReino } from './useCatalogoDoReino';
import type { FichaComProgresso } from './useProgressoArcano';

export interface ProgressoArcanoPanelProps {
  papelMestre: boolean;
  fichasVisiveis: MesaResumo[];
  progressoPorFicha: FichaComProgresso[];
  nomesPorEscola: Map<string, string>;
  arcanoQuery: UseAsyncDataResult<ProgressoArcanoFicha[]>;
  resumoQuery: UseAsyncDataResult<MesaResumo[]>;
  catalogoQuery: UseAsyncDataResult<CatalogoDoReino>;
}

/** Magias aprendidas por ficha, com a barra de progresso sobre o catálogo total. */
export const ProgressoArcanoPanel: React.FC<ProgressoArcanoPanelProps> = ({
  papelMestre,
  fichasVisiveis,
  progressoPorFicha,
  nomesPorEscola,
  arcanoQuery,
  resumoQuery,
  catalogoQuery,
}) => (
  <PainelSecao
    id="progresso-arcano-titulo"
    icon={<Wand2 className="h-4 w-4" aria-hidden="true" />}
    title="Progresso arcano"
    hint={papelMestre ? 'magias aprendidas na mesa' : 'suas magias aprendidas'}
    contentClassName="p-4"
  >
    {arcanoQuery.isLoading || resumoQuery.isLoading || catalogoQuery.isLoading ? (
      <div role="status" aria-live="polite">
        <span className="sr-only">Carregando o progresso arcano…</span>
        <div className="space-y-2">
          <Skeleton className="h-[68px] w-full" />
          <Skeleton className="h-[68px] w-full" />
        </div>
      </div>
    ) : arcanoQuery.error || resumoQuery.error || catalogoQuery.error ? (
      <ErrorState
        description={arcanoQuery.error ?? resumoQuery.error ?? catalogoQuery.error ?? ''}
        onRetry={() => {
          arcanoQuery.reload();
          resumoQuery.reload();
          catalogoQuery.reload();
        }}
      />
    ) : fichasVisiveis.length === 0 ? (
      <EmptyState
        variant="plano"
        icon={<Wand2 className="h-8 w-8" aria-hidden="true" />}
        title="Sem progresso arcano"
        description={
          papelMestre
            ? 'As magias aprendidas de cada ficha aparecerão aqui.'
            : 'Aprenda magias no Grimório para acompanhar sua evolução aqui.'
        }
      />
    ) : (
      <ul className="space-y-2">
        {progressoPorFicha.map((ficha) => {
          const escolas = (Object.entries(ficha.progresso.porEscola) as Array<[string, number]>)
            .sort((a, b) => b[1] - a[1])
            .map(([id, quantidade]) => ({ nome: nomesPorEscola.get(id) ?? id, quantidade }));
          const textoEscolas =
            escolas.length === 0
              ? 'Nenhuma magia aprendida ainda'
              : `${escolas.slice(0, 3).map((escola) => `${escola.nome} ${escola.quantidade}`).join(' · ')}${
                  escolas.length > 3
                    ? ` · +${escolas.length - 3} ${escolas.length - 3 === 1 ? 'escola' : 'escolas'}`
                    : ''
                }`;
          return (
            <li key={ficha.id} className="rounded-xs border border-[#3e2d1d] bg-[#160f0a] px-3 py-2.5">
              <p className="truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba]">{ficha.nome}</p>
              <BarraProgresso
                className="mt-1.5"
                rotulo="Magias aprendidas"
                atual={ficha.progresso.aprendidas}
                max={catalogoQuery.data?.magias ?? 0}
                limiarCritico={0}
              />
              <span className="mt-1.5 block font-serif text-[11px] italic text-[#8f795e]">{textoEscolas}</span>
            </li>
          );
        })}
      </ul>
    )}
  </PainelSecao>
);

export default ProgressoArcanoPanel;
