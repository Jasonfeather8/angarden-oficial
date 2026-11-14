import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { fichaService } from '@/services/fichaService';

/** Personagem oferecido no seletor de presenças do formulário. */
export type PersonagemDaCronica = Awaited<ReturnType<typeof fichaService.getListaPersonagens>>[number];

/**
 * Personagens do cliente para marcar quem esteve na sessão. A busca só acontece
 * com o formulário aberto; fora dele a lista não é usada.
 */
export function usePersonagensDaCronica(tenantId: string | null, formularioAberto: boolean) {
  const { data, isLoading, error, reload } = useAsyncData(
    () => fichaService.getListaPersonagens(),
    [tenantId],
    {
      cacheKey: cacheKeys.personagensResumo(tenantId),
      enabled: formularioAberto && Boolean(tenantId),
    },
  );

  return {
    personagens: data ?? [],
    isLoadingPersonagens: isLoading,
    erroPersonagens: error,
    reloadPersonagens: reload,
  };
}
