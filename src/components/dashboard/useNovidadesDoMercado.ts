import { useAsyncData } from '../../hooks/useAsyncData';
import { cacheKeys } from '../../services/cacheKeys';
import { mercadoService } from '../../services/mercadoService';

/** As últimas mercadorias publicadas no catálogo global. */
export function useNovidadesDoMercado() {
  return useAsyncData(
    () => mercadoService.listarNovidades(3),
    [],
    { cacheKey: cacheKeys.mercadoNovidades() }
  );
}
