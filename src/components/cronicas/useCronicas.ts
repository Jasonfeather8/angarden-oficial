import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { cronicaService } from '@/services/cronicaService';

/**
 * Crônicas do cliente, da mais recente para a mais antiga. A crônica aberta
 * agora é uma rota própria (`/cronicas/:cronicaId`).
 */
export function useCronicas(tenantId: string | null) {
  const { data, isLoading, error, reload } = useAsyncData(
    () => cronicaService.listar(),
    [tenantId],
    { cacheKey: cacheKeys.cronicas(tenantId), enabled: Boolean(tenantId) },
  );

  return { cronicas: data ?? [], isLoading, error, reload };
}
