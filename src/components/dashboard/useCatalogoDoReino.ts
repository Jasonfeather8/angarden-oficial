import { useAsyncData } from '../../hooks/useAsyncData';
import { cacheKeys } from '../../services/cacheKeys';
import { contarMagias } from '../../services/grimorioService';
import { mercadoService } from '../../services/mercadoService';
import type { UserRole } from '../../types';

/** Contagem do catálogo global (magias do Grimório e mercadorias do Mercado). */
export interface CatalogoDoReino {
  magias: number;
  mercadorias: number;
}

export function useCatalogoDoReino(tenantId: string | null, role: UserRole | null) {
  return useAsyncData<CatalogoDoReino>(
    async () => {
      const [magias, mercadorias] = await Promise.all([contarMagias(), mercadoService.contarItens()]);
      return { magias, mercadorias };
    },
    [tenantId, role],
    { cacheKey: cacheKeys.catalogoDoReino(`${tenantId ?? ''}:${role ?? ''}`), enabled: Boolean(tenantId) }
  );
}
