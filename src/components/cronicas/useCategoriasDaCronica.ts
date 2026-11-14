import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { cronicaService } from '@/services/cronicaService';
import type { CategoriaDeCronica } from '@/types';

export function useCategoriasDaCronica(tenantId: string | null) {
  const { data, isLoading, error, reload } = useAsyncData(
    () => cronicaService.listarCategorias(),
    [tenantId],
    { cacheKey: cacheKeys.cronicaCategorias(tenantId), enabled: Boolean(tenantId) },
  );
  return { categorias: data ?? [] as CategoriaDeCronica[], isLoading, error, reload };
}
