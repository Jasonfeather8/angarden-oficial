import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { cronicaService } from '@/services/cronicaService';

/**
 * Crônicas do cliente, da mais recente para a mais antiga, e qual delas está em
 * leitura. A seleção vive na URL (`?cronica=<id>`), então o relato aberto
 * sobrevive ao F5 e ao compartilhamento do endereço.
 */
export function useCronicas(tenantId: string | null) {
  const { data, isLoading, error, reload } = useAsyncData(
    () => cronicaService.listar(),
    [tenantId],
    { cacheKey: cacheKeys.cronicas(tenantId), enabled: Boolean(tenantId) },
  );

  const cronicas = data ?? [];
  const [searchParams, setSearchParams] = useSearchParams();
  const selecionadaId = searchParams.get('cronica');
  const selecionada = cronicas.find((cronica) => cronica.id === selecionadaId) ?? cronicas[0];

  const selecionar = useCallback(
    (id: string) => setSearchParams({ cronica: id }, { replace: true }),
    [setSearchParams],
  );

  return { cronicas, selecionada, selecionar, isLoading, error, reload };
}
