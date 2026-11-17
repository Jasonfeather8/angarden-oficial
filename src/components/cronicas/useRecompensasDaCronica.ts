import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { cronicaService } from '@/services/cronicaService';
import type { RecompensaDaCronica } from '@/types';

/**
 * Recompensas da crônica. `versao` sobe quando uma escrita na crônica pode ter
 * mexido nas recompensas (a estrela do destaque, por exemplo): assim uma tela
 * que já está montada revalida junto com quem escreveu.
 */
export function useRecompensasDaCronica(cronicaId: string | null, versao = 0) {
  const { data, isLoading, error, reload } = useAsyncData(
    () => cronicaService.listarRecompensas(cronicaId!),
    [cronicaId, versao],
    { cacheKey: cacheKeys.cronicaRecompensas(cronicaId), enabled: Boolean(cronicaId) },
  );
  return { recompensas: data ?? [] as RecompensaDaCronica[], isLoading, error, reload };
}
