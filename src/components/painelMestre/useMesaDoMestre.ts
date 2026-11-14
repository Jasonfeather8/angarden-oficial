import { useMemo } from 'react';
import { invalidateAsyncDataCache, useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeyPrefixes, cacheKeys } from '@/services/cacheKeys';
import { fichaService } from '@/services/fichaService';
import { profileService } from '@/services/profileService';
import type { FichaCompleta } from '@/types';

export type CharacterStatus = {
  vidaAtual: number;
  vidaMax: number;
  vigorAtual: number;
  vigorMax: number;
  north: number;
};

export type CharacterRow = {
  id: string;
  nome: string;
  ownerId: string | null;
  imagemUrl?: string;
  nivel: number;
  xp: number;
  dinheiro: number;
  edicaoLiberada: boolean;
  acessoMercadoEpico: boolean;
  acessoMercadoArcano: boolean;
  acessoMercadoLendario: boolean;
  podeComprar: boolean;
  /** Vitais do motor; quando ainda não chegaram, vêm do último salvamento. */
  status: CharacterStatus | null;
};

interface UseMesaDoMestreOptions {
  /** O painel é restrito ao Mestre; fora disso nenhuma consulta é feita. */
  isMaster: boolean;
  tenantId: string | null;
  /** Recebe string vazia quando a mesa é recarregada, para limpar o aviso da tela. */
  onStatus: (mensagem: string) => void;
}

/**
 * Fichas da mesa em três consultas: o resumo leve (`mestreResumo`), o detalhe
 * completo (`mestreFichas`, só quando algum vitral do motor ainda não chegou) e
 * os nomes dos jogadores do cliente, para identificar o dono de cada ficha.
 * Devolve as linhas da mesa já normalizadas e as operações de recarga.
 */
export function useMesaDoMestre({ isMaster, tenantId, onStatus }: UseMesaDoMestreOptions) {
  const resumoQuery = useAsyncData(
    () => (tenantId ? fichaService.getResumoDaMesa() : Promise.resolve([])),
    [tenantId],
    { cacheKey: cacheKeys.mestreResumo(tenantId), enabled: isMaster && Boolean(tenantId) }
  );

  const mesaResumo = resumoQuery.data ?? [];
  const precisaMotor = mesaResumo.some((item) => item.status === null);
  const detalheQuery = useAsyncData(
    () => (tenantId ? fichaService.getMesaCompleta() : Promise.resolve(new Map<string, FichaCompleta>())),
    [tenantId],
    { cacheKey: cacheKeys.mestreFichas(tenantId), enabled: isMaster && Boolean(tenantId) && precisaMotor }
  );

  // Nomes dos jogadores do cliente: uma consulta leve, só para identificar o dono de cada ficha.
  const perfisQuery = useAsyncData(
    () => (tenantId ? profileService.listarDoCliente(tenantId) : Promise.resolve([])),
    [tenantId],
    { cacheKey: cacheKeys.perfisDoCliente(tenantId), enabled: isMaster && Boolean(tenantId) }
  );

  const nomesPorJogador = useMemo(() => {
    const mapa = new Map<string, string>();
    (perfisQuery.data ?? []).forEach((perfil) => {
      const nome = perfil.nome_completo?.trim();
      if (nome) mapa.set(perfil.id, nome);
    });
    return mapa;
  }, [perfisQuery.data]);

  const mesaCompleta = detalheQuery.data;

  const characters = useMemo<CharacterRow[]>(() => mesaResumo.map((item) => {
    const ficha = mesaCompleta?.get(item.id) ?? null;
    return {
      id: item.id,
      nome: ficha?.identidade.nome_personagem?.trim() || item.nome,
      ownerId: item.ownerId,
      imagemUrl: ficha?.identidade.imagem_url || item.imagemUrl,
      nivel: Number(ficha?.identidade.nivel ?? item.nivel) || 1,
      xp: Number(ficha?.identidade.xp ?? item.xp) || 0,
      dinheiro: Math.max(0, Number(ficha?.recursos.dinheiro ?? item.dinheiro) || 0),
      edicaoLiberada: ficha?.identidade.edicao_liberada ?? item.edicaoLiberada,
      acessoMercadoEpico: ficha?.identidade.acesso_mercado_epico ?? item.acessoMercadoEpico,
      acessoMercadoArcano: ficha?.identidade.acesso_mercado_arcano ?? item.acessoMercadoArcano,
      acessoMercadoLendario: ficha?.identidade.acesso_mercado_lendario ?? item.acessoMercadoLendario,
      podeComprar: ficha?.identidade.pode_comprar ?? item.podeComprar,
      status: ficha
        ? {
            vidaAtual: Number(ficha.status.vida_atual) || 0,
            vidaMax: Number(ficha.status.vida_max) || 0,
            vigorAtual: Number(ficha.status.vigor_atual) || 0,
            vigorMax: Number(ficha.status.vigor_max) || 0,
            north: Number(ficha.status.north) || 0,
          }
        : item.status,
    } satisfies CharacterRow;
  }), [mesaResumo, mesaCompleta]);

  // O esqueleto só aparece quando não há nada para mostrar; com fichas em tela, cada cartão
  // mostra o próprio esqueleto enquanto os vitais do motor não chegam.
  const isLoading = characters.length === 0 && (resumoQuery.isLoading || detalheQuery.isLoading);
  const carregando = resumoQuery.isLoading || detalheQuery.isLoading;
  const loadError = resumoQuery.error || detalheQuery.error
    ? 'Não foi possível carregar as fichas da mesa. Verifique sua conexão e tente novamente.'
    : '';

  const refresh = () => {
    onStatus('');
    resumoQuery.reload();
    detalheQuery.reload();
    perfisQuery.reload();
  };

  const invalidateCaches = () => {
    invalidateAsyncDataCache(cacheKeyPrefixes.mestreFichas);
    invalidateAsyncDataCache(cacheKeys.personagensResumo(tenantId));
    invalidateAsyncDataCache(cacheKeys.mestreResumo(tenantId));
  };

  /** Descarta os caches afetados e recarrega a mesa depois de uma escrita. */
  const atualizar = () => {
    invalidateCaches();
    refresh();
  };

  return { characters, nomesPorJogador, isLoading, carregando, loadError, refresh, atualizar };
}
