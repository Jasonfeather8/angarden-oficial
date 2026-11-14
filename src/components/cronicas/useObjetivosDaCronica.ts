import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { cronicaService } from '@/services/cronicaService';
import type { ObjetivoDaCronica } from '@/types';

export function useObjetivosDaCronica(cronicaId: string | null) {
  const { data, isLoading, error, reload } = useAsyncData(
    () => cronicaService.listarObjetivos(cronicaId!),
    [cronicaId],
    { cacheKey: cacheKeys.cronicaObjetivos(cronicaId), enabled: Boolean(cronicaId) },
  );
  return { objetivos: data ?? [] as ObjetivoDaCronica[], isLoading, error, reload };
}
