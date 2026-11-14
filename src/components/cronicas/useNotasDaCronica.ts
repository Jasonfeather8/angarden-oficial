import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { cronicaService } from '@/services/cronicaService';
import type { NotaDaCronica } from '@/types';

export function useNotasDaCronica(cronicaId: string | null) {
  const { data, isLoading, error, reload } = useAsyncData(
    () => cronicaService.listarNotas(cronicaId!),
    [cronicaId],
    { cacheKey: cacheKeys.cronicaNotas(cronicaId), enabled: Boolean(cronicaId) },
  );
  return { notas: data ?? [] as NotaDaCronica[], isLoading, error, reload };
}
