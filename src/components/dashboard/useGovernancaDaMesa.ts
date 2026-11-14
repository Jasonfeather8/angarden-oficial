import { useMemo } from 'react';
import { useAsyncData } from '../../hooks/useAsyncData';
import { cacheKeys } from '../../services/cacheKeys';
import { fichaService } from '../../services/fichaService';
import { grimorioBloqueioService } from '../../services/grimorioBloqueioService';
import { profileService } from '../../services/profileService';
import type { PerfilConta } from '../../types';
import { contar } from './formatters';

/** Perfis do cliente e a contagem de fichas de cada jogador. */
export interface LimitesDaMesa {
  perfis: PerfilConta[];
  contagens: Record<string, number>;
}

/**
 * Governança da mesa: limites de fichas (por jogador ou da conta) e os selos do
 * Grimório. Alimenta as pendências e as métricas do reino.
 */
export function useGovernancaDaMesa(tenantId: string | null, papelMestre: boolean, userId: string | null) {
  const limitesQuery = useAsyncData<LimitesDaMesa>(
    async () => {
      const [perfis, contagens] = await Promise.all([
        profileService.listarDoCliente(tenantId as string),
        fichaService.contarFichasPorJogador(),
      ]);
      return { perfis, contagens };
    },
    [tenantId],
    { cacheKey: cacheKeys.limitesDeFichas(tenantId), enabled: papelMestre && Boolean(tenantId) }
  );
  const limiteQuery = useAsyncData(
    () => (userId ? profileService.getLimiteFichas(userId) : Promise.resolve(10)),
    [userId],
    { cacheKey: cacheKeys.limiteFichasDoJogador(userId), enabled: !papelMestre && Boolean(userId) }
  );
  const bloqueiosQuery = useAsyncData(
    () => grimorioBloqueioService.listar(),
    [tenantId],
    { cacheKey: cacheKeys.grimorioBloqueios(tenantId), enabled: Boolean(tenantId) }
  );

  const jogadores = useMemo(
    () => (limitesQuery.data?.perfis ?? []).filter((perfil) => perfil.role !== 'admin'),
    [limitesQuery.data?.perfis]
  );
  const totalJogadores = useMemo(
    () => jogadores.filter((perfil) => perfil.role === 'jogador').length,
    [jogadores]
  );
  const contagens = useMemo(() => limitesQuery.data?.contagens ?? {}, [limitesQuery.data?.contagens]);
  const nomesPorJogador = useMemo(
    () => new Map(jogadores.map((perfil) => [perfil.id, perfil.nome_completo])),
    [jogadores]
  );
  const partesSeladas = useMemo(() => {
    const escolas = bloqueiosQuery.data?.escolas.length ?? 0;
    const tomos = bloqueiosQuery.data?.volumes.length ?? 0;
    return [
      escolas ? contar(escolas, 'escola', 'escolas') : '',
      tomos ? contar(tomos, 'tomo', 'tomos') : '',
    ].filter(Boolean);
  }, [bloqueiosQuery.data]);

  return {
    limitesQuery,
    limiteQuery,
    bloqueiosQuery,
    jogadores,
    totalJogadores,
    contagens,
    nomesPorJogador,
    partesSeladas,
  };
}
