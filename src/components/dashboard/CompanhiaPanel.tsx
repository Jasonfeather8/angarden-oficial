import React from 'react';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import { fichaPath, ROUTES } from '../../routes/paths';
import type { MesaResumo } from '../../services/fichaService';
import { CardAventureiroMesa } from '../CardAventureiroMesa';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { Skeleton } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { contar } from './formatters';

export interface CompanhiaPanelProps {
  papelMestre: boolean;
  fichasVisiveis: MesaResumo[];
  nomesPorJogador: Map<string, string>;
  resumoQuery: UseAsyncDataResult<MesaResumo[]>;
}

/** Cartões dos personagens da mesa (ou das fichas do próprio jogador). */
export const CompanhiaPanel: React.FC<CompanhiaPanelProps> = ({
  papelMestre,
  fichasVisiveis,
  nomesPorJogador,
  resumoQuery,
}) => {
  const navigate = useNavigate();

  return (
    <PainelSecao
      id="companhia-titulo"
      icon={<Users className="h-4 w-4" />}
      title="A companhia"
      hint={
        papelMestre
          ? `${contar(fichasVisiveis.length, 'ficha', 'fichas')} na mesa`
          : `${contar(fichasVisiveis.length, 'ficha sua', 'fichas suas')}`
      }
      contentClassName="p-4"
    >
      {resumoQuery.isLoading ? (
        <div role="status" aria-live="polite">
          <span className="sr-only">Carregando a companhia…</span>
          <div className="grid gap-3 xl:grid-cols-2">
            <Skeleton className="h-[190px] w-full" />
            <Skeleton className="h-[190px] w-full" />
          </div>
        </div>
      ) : resumoQuery.error ? (
        <ErrorState description={resumoQuery.error} onRetry={resumoQuery.reload} />
      ) : fichasVisiveis.length === 0 ? (
        <EmptyState
          variant="plano"
          icon={<Users className="h-8 w-8" />}
          title={papelMestre ? 'Nenhuma ficha na mesa' : 'Você ainda não tem ficha'}
          description={
            papelMestre
              ? 'Quando os jogadores criarem personagens, eles aparecerão aqui.'
              : 'Crie seu primeiro aventureiro para começar a jornada.'
          }
          action={
            <ToolbarButton variant="primary" onClick={() => navigate(ROUTES.personagens)}>
              {papelMestre ? 'Ir para Personagens' : 'Criar ficha'}
            </ToolbarButton>
          }
        />
      ) : (
        <div className="grid gap-3 xl:grid-cols-2">
          {fichasVisiveis.map((item) => (
            <CardAventureiroMesa
              key={item.id}
              aventureiro={{
                ...item,
                jogador: nomesPorJogador.get(item.ownerId ?? '') ?? null,
                status: item.status ?? { vidaAtual: 0, vidaMax: 0, vigorAtual: 0, vigorMax: 0, north: 0 },
              }}
              onAbrirFicha={(id) => navigate(fichaPath(id))}
            />
          ))}
        </div>
      )}
    </PainelSecao>
  );
};

export default CompanhiaPanel;
