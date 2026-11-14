import { useMemo } from 'react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { cacheKeys } from '../../services/cacheKeys';
import { fichaService } from '../../services/fichaService';
import { useAppStore } from '../../store/useAppStore';

/**
 * Resumo das fichas da mesa: o Mestre enxerga todas, o jogador apenas as suas.
 * Também deriva o "continuar de onde parei" e os nomes usados por outros painéis.
 */
export function useResumoDaMesa(tenantId: string | null, papelMestre: boolean, userId: string | null) {
  const lastCharacterId = useAppStore((state) => state.lastCharacterId);

  const resumoQuery = useAsyncData(
    () => fichaService.getResumoDaMesa(),
    [tenantId],
    { cacheKey: cacheKeys.mestreResumo(tenantId), enabled: Boolean(tenantId) }
  );

  const mesaResumo = useMemo(() => resumoQuery.data ?? [], [resumoQuery.data]);
  const fichasVisiveis = useMemo(
    () => (papelMestre ? mesaResumo : mesaResumo.filter((item) => item.ownerId === userId)),
    [mesaResumo, papelMestre, userId]
  );
  const nomesPorFicha = useMemo(
    () => new Map(mesaResumo.map((ficha) => [ficha.id, ficha.nome])),
    [mesaResumo]
  );
  const continuar = useMemo(
    () =>
      fichasVisiveis.find((item) => item.id === lastCharacterId) ??
      (fichasVisiveis.length === 1 ? fichasVisiveis[0] : null),
    [fichasVisiveis, lastCharacterId]
  );

  return { resumoQuery, mesaResumo, fichasVisiveis, nomesPorFicha, continuar };
}
