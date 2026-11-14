import { useMemo } from 'react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { cacheKeys } from '../../services/cacheKeys';
import { fichaService } from '../../services/fichaService';
import { profileService } from '../../services/profileService';
import type { TenantCharacter } from '../../types';

/**
 * Acervo de personagens do cliente autenticado e o teto de fichas do jogador,
 * com as contagens derivadas usadas pelo cabeçalho.
 */
export function useAcervoDePersonagens(tenantId: string | null, userId: string | null) {
  // O acervo é sempre o do cliente (tenant) autenticado.
  const acervoQuery = useAsyncData<TenantCharacter[]>(
    () => fichaService.getTenantCharacters(),
    [],
    { cacheKey: cacheKeys.acervoPersonagens(tenantId) }
  );
  const limiteQuery = useAsyncData(
    () => (userId ? profileService.getLimiteFichas(userId) : Promise.resolve(10)),
    [userId],
    { cacheKey: cacheKeys.limiteFichasDoJogador(userId), enabled: Boolean(userId) }
  );

  const characters = useMemo(() => acervoQuery.data ?? [], [acervoQuery.data]);
  const minhasFichas = characters.filter((character) => character.ownerId === userId).length;
  const limite = limiteQuery.data ?? 10;
  const limiteAtingido = Boolean(userId) && limiteQuery.data !== null && minhasFichas >= limite;

  return { acervoQuery, limiteQuery, characters, minhasFichas, limite, limiteAtingido };
}
