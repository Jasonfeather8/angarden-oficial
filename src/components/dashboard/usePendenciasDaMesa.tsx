import React, { useMemo } from 'react';
import { Lock, Pencil, UserPlus, Users } from 'lucide-react';
import type { UseAsyncDataResult } from '../../hooks/useAsyncData';
import { ROUTES } from '../../routes/paths';
import type { GrimorioBloqueios } from '../../services/grimorioBloqueioService';
import type { MesaResumo } from '../../services/fichaService';
import type { PerfilConta } from '../../types';
import { contar } from './formatters';
import type { LimitesDaMesa } from './useGovernancaDaMesa';

export interface Pendencia {
  id: string;
  texto: string;
  icon: React.ReactNode;
  acao: string;
  to: string;
}

export interface UsePendenciasDaMesaInput {
  fichasVisiveis: MesaResumo[];
  papelMestre: boolean;
  jogadores: PerfilConta[];
  contagens: Record<string, number>;
  partesSeladas: string[];
  resumoQuery: UseAsyncDataResult<MesaResumo[]>;
  limitesQuery: UseAsyncDataResult<LimitesDaMesa>;
  limiteQuery: UseAsyncDataResult<number>;
  bloqueiosQuery: UseAsyncDataResult<GrimorioBloqueios>;
}

/**
 * Pendências da mesa segundo o papel: fichas sem edição, jogadores no teto (ou sem
 * ficha) para o Mestre, e limite atingido + Grimório selado para o jogador.
 */
export function usePendenciasDaMesa({
  fichasVisiveis,
  papelMestre,
  jogadores,
  contagens,
  partesSeladas,
  resumoQuery,
  limitesQuery,
  limiteQuery,
  bloqueiosQuery,
}: UsePendenciasDaMesaInput) {
  const pendencias = useMemo<Pendencia[]>(() => {
    const itens: Pendencia[] = [];
    const semEdicao = fichasVisiveis.filter((ficha) => !ficha.edicaoLiberada).length;
    if (semEdicao > 0) {
      itens.push({
        id: 'sem-edicao',
        texto: papelMestre
          ? `${contar(semEdicao, 'ficha', 'fichas')} sem edição liberada`
          : `${contar(semEdicao, 'ficha sua', 'fichas suas')} sem edição liberada`,
        icon: <Pencil className="h-3.5 w-3.5" />,
        acao: papelMestre ? 'Ajustar permissões' : 'Ver fichas',
        to: papelMestre ? ROUTES.painelMestre : ROUTES.personagens,
      });
    }
    if (papelMestre) {
      const noTeto = jogadores.filter(
        (perfil) => (contagens[perfil.id] ?? 0) >= (perfil.limite_fichas ?? 10)
      ).length;
      const semFicha = jogadores.filter((perfil) => (contagens[perfil.id] ?? 0) === 0).length;
      if (noTeto > 0) {
        itens.push({
          id: 'teto-fichas',
          texto: `${contar(noTeto, 'jogador', 'jogadores')} no teto de fichas`,
          icon: <Users className="h-3.5 w-3.5" />,
          acao: 'Ajustar limites',
          to: ROUTES.painelMestre,
        });
      }
      if (semFicha > 0) {
        itens.push({
          id: 'sem-ficha',
          texto: `${contar(semFicha, 'jogador', 'jogadores')} ainda sem ficha criada`,
          icon: <UserPlus className="h-3.5 w-3.5" />,
          acao: 'Ver jogadores',
          to: ROUTES.painelMestre,
        });
      }
    } else {
      if (limiteQuery.data !== null && fichasVisiveis.length >= (limiteQuery.data ?? 10)) {
        itens.push({
          id: 'limite-atingido',
          texto: `Limite de ${contar(limiteQuery.data ?? 10, 'ficha', 'fichas')} atingido`,
          icon: <Users className="h-3.5 w-3.5" />,
          acao: 'Ver fichas',
          to: ROUTES.personagens,
        });
      }
      if (partesSeladas.length) {
        itens.push({
          id: 'grimorio-selado',
          texto: `O Mestre selou ${partesSeladas.join(' e ')} do Grimório`,
          icon: <Lock className="h-3.5 w-3.5" />,
          acao: 'Ver Grimório',
          to: ROUTES.grimorio,
        });
      }
    }
    return itens;
  }, [fichasVisiveis, papelMestre, jogadores, contagens, limiteQuery.data, partesSeladas]);

  const carregando =
    resumoQuery.isLoading ||
    (papelMestre ? limitesQuery.isLoading : limiteQuery.isLoading || bloqueiosQuery.isLoading);
  const erro = papelMestre
    ? resumoQuery.error || limitesQuery.error
    : resumoQuery.error || limiteQuery.error || bloqueiosQuery.error;
  const recarregar = () => {
    resumoQuery.reload();
    if (papelMestre) limitesQuery.reload();
    else {
      limiteQuery.reload();
      bloqueiosQuery.reload();
    }
  };

  return { pendencias, carregando, erro, recarregar };
}
