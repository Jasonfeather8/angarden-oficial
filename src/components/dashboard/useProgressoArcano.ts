import { useMemo } from 'react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { grimorioAllSchools } from '../../mocks/grimorio';
import { cacheKeys } from '../../services/cacheKeys';
import type { MesaResumo } from '../../services/fichaService';
import { listarProgressoArcano, type ProgressoArcanoFicha } from '../../services/grimorioService';

/** Ficha da mesa com o progresso arcano resolvido. */
export type FichaComProgresso = MesaResumo & { progresso: ProgressoArcanoFicha };

/** Progresso arcano das fichas visíveis, já ordenado e com o nome das escolas resolvido. */
export function useProgressoArcano(
  tenantId: string | null,
  papelMestre: boolean,
  userId: string | null,
  fichasVisiveis: MesaResumo[]
) {
  const idsArcanos = useMemo(() => fichasVisiveis.map((ficha) => ficha.id).join(','), [fichasVisiveis]);
  const arcanoQuery = useAsyncData(
    () => listarProgressoArcano(papelMestre ? undefined : fichasVisiveis.map((ficha) => ficha.id)),
    [tenantId, papelMestre, idsArcanos],
    {
      cacheKey: cacheKeys.progressoArcano(`${tenantId ?? ''}:${userId ?? ''}`),
      enabled: Boolean(tenantId) && (papelMestre || fichasVisiveis.length > 0),
    }
  );
  const progressoPorFicha = useMemo(() => {
    const progressoMap = new Map((arcanoQuery.data ?? []).map((progresso) => [progresso.characterId, progresso]));
    return fichasVisiveis
      .map((ficha) => ({
        ...ficha,
        progresso:
          progressoMap.get(ficha.id) ??
          { characterId: ficha.id, aprendidas: 0, porEscola: {} as Record<string, number> },
      }))
      .sort(
        (a, b) =>
          b.progresso.aprendidas - a.progresso.aprendidas || a.nome.localeCompare(b.nome, 'pt-BR')
      );
  }, [fichasVisiveis, arcanoQuery.data]);
  const nomesPorEscola = useMemo(
    () => new Map(grimorioAllSchools.map((escola) => [escola.id, escola.name])),
    []
  );

  return { arcanoQuery, progressoPorFicha, nomesPorEscola };
}
