import React, { useMemo } from 'react';
import { BookOpen, Coins, Lock, Store, Swords, TrendingUp, Trophy, Users } from 'lucide-react';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import type { GrimorioBloqueios } from '../../services/grimorioBloqueioService';
import type { MesaResumo } from '../../services/fichaService';
import type { PerfilConta } from '../../types';
import { PainelSecao } from '../ui/PainelSecao';
import { PlacaMetrica } from '../ui/PlacaMetrica';
import { Skeleton } from '../ui/Skeleton';
import { formatarNumero } from './formatters';
import type { CatalogoDoReino } from './useCatalogoDoReino';
import type { LimitesDaMesa } from './useGovernancaDaMesa';

interface Metrica {
  rotulo: string;
  icon: React.ReactNode;
  valor: number;
  hint: string;
  loading: boolean;
  error: string | null;
}

export interface MetricasDoReinoPanelProps {
  papelMestre: boolean;
  fichasVisiveis: MesaResumo[];
  jogadores: PerfilConta[];
  partesSeladas: string[];
  resumoQuery: UseAsyncDataResult<MesaResumo[]>;
  limitesQuery: UseAsyncDataResult<LimitesDaMesa>;
  catalogoQuery: UseAsyncDataResult<CatalogoDoReino>;
  limiteQuery: UseAsyncDataResult<number>;
  bloqueiosQuery: UseAsyncDataResult<GrimorioBloqueios>;
}

/** Faixa de métricas do cliente, com o conjunto de números variando por papel. */
export const MetricasDoReinoPanel: React.FC<MetricasDoReinoPanelProps> = ({
  papelMestre,
  fichasVisiveis,
  jogadores,
  partesSeladas,
  resumoQuery,
  limitesQuery,
  catalogoQuery,
  limiteQuery,
  bloqueiosQuery,
}) => {
  const nivelMaisAlto = useMemo(
    () => Math.max(0, ...fichasVisiveis.map((ficha) => ficha.nivel)),
    [fichasVisiveis]
  );
  const tesouroTotal = useMemo(
    () => fichasVisiveis.reduce((total, ficha) => total + ficha.dinheiro, 0),
    [fichasVisiveis]
  );

  const metricas: Metrica[] = papelMestre
    ? [
        { rotulo: 'Fichas na mesa', icon: <Swords className="h-4 w-4" />, valor: fichasVisiveis.length, hint: 'no cliente', loading: resumoQuery.isLoading, error: resumoQuery.error },
        { rotulo: 'Jogadores', icon: <Users className="h-4 w-4" />, valor: jogadores.length, hint: 'contas no cliente', loading: limitesQuery.isLoading, error: limitesQuery.error },
        { rotulo: 'Magias no Grimório', icon: <BookOpen className="h-4 w-4" />, valor: catalogoQuery.data?.magias ?? 0, hint: 'catalogadas', loading: catalogoQuery.isLoading, error: catalogoQuery.error },
        { rotulo: 'Mercadorias', icon: <Store className="h-4 w-4" />, valor: catalogoQuery.data?.mercadorias ?? 0, hint: 'no mercado global', loading: catalogoQuery.isLoading, error: catalogoQuery.error },
        { rotulo: 'Conteúdo selado', icon: <Lock className="h-4 w-4" />, valor: (bloqueiosQuery.data?.escolas.length ?? 0) + (bloqueiosQuery.data?.volumes.length ?? 0), hint: partesSeladas.join(' · ') || 'nada selado', loading: bloqueiosQuery.isLoading, error: bloqueiosQuery.error },
      ]
    : [
        { rotulo: 'Suas fichas', icon: <Swords className="h-4 w-4" />, valor: fichasVisiveis.length, hint: limiteQuery.data !== null ? `limite de ${formatarNumero(limiteQuery.data ?? 10)} fichas` : '', loading: resumoQuery.isLoading, error: resumoQuery.error },
        { rotulo: 'Nível mais alto', icon: <Trophy className="h-4 w-4" />, valor: nivelMaisAlto, hint: 'entre suas fichas', loading: resumoQuery.isLoading, error: resumoQuery.error },
        { rotulo: 'Seu tesouro', icon: <Coins className="h-4 w-4" />, valor: tesouroTotal, hint: 'moedas somadas', loading: resumoQuery.isLoading, error: resumoQuery.error },
        { rotulo: 'Magias no Grimório', icon: <BookOpen className="h-4 w-4" />, valor: catalogoQuery.data?.magias ?? 0, hint: 'visíveis a você', loading: catalogoQuery.isLoading, error: catalogoQuery.error },
        { rotulo: 'Mercadorias', icon: <Store className="h-4 w-4" />, valor: catalogoQuery.data?.mercadorias ?? 0, hint: 'no mercado global', loading: catalogoQuery.isLoading, error: catalogoQuery.error },
      ];

  return (
    <PainelSecao id="metricas-titulo" icon={<TrendingUp className="h-4 w-4" />} title="O reino em números" hint="métricas do cliente" contentClassName="p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metricas.map((metrica) => (
          <PlacaMetrica
            key={metrica.rotulo}
            icon={metrica.icon}
            rotulo={metrica.rotulo}
            valor={metrica.error ? '—' : metrica.loading ? <Skeleton className="h-5 w-10" /> : formatarNumero(metrica.valor)}
            hint={metrica.error ? 'indisponível agora' : metrica.hint}
          />
        ))}
      </div>
    </PainelSecao>
  );
};

export default MetricasDoReinoPanel;
