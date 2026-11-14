import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { cronicaService } from '@/services/cronicaService';
import type { RecompensaDaCronica } from '@/types';

export function useRecompensasDaCronica(cronicaId: string | null) {
  const { data, isLoading, error, reload } = useAsyncData(
    () => cronicaService.listarRecompensas(cronicaId!),
    [cronicaId],
    { cacheKey: cacheKeys.cronicaRecompensas(cronicaId), enabled: Boolean(cronicaId) },
  );
  return { recompensas: data ?? [] as RecompensaDaCronica[], isLoading, error, reload };
}
