import { useAsyncData } from '../../hooks/useAsyncData';
import { cacheKeys } from '../../services/cacheKeys';
import { cronicaService } from '../../services/cronicaService';

/** Os três relatos mais recentes da mesa. */
export function useCronicasRecentes(tenantId: string | null) {
  return useAsyncData(
    () => cronicaService.listarRecentes(3),
    [tenantId],
    { cacheKey: cacheKeys.cronicasRecentes(tenantId), enabled: Boolean(tenantId) }
  );
}
