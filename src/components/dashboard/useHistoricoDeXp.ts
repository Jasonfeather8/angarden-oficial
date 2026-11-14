import { useMemo } from 'react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { cacheKeys } from '../../services/cacheKeys';
import type { MesaResumo } from '../../services/fichaService';
import { fichaService } from '../../services/fichaService';

/** Últimas concessões de XP da mesa (ou apenas das fichas do jogador). */
export function useHistoricoDeXp(
  tenantId: string | null,
  papelMestre: boolean,
  userId: string | null,
  fichasVisiveis: MesaResumo[]
) {
  const idsDoHistorico = useMemo(() => fichasVisiveis.map((ficha) => ficha.id).join(','), [fichasVisiveis]);
  return useAsyncData(
    () =>
      fichaService.listarHistoricoXp({
        characterIds: papelMestre ? undefined : fichasVisiveis.map((ficha) => ficha.id),
        limite: 6,
      }),
    [tenantId, papelMestre, idsDoHistorico],
    {
      cacheKey: cacheKeys.historicoXp(`${tenantId ?? ''}:${userId ?? ''}`),
      enabled: Boolean(tenantId) && (papelMestre || fichasVisiveis.length > 0),
    }
  );
}
