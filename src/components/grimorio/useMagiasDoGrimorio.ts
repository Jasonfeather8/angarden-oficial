import { useCallback, useEffect, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  carregarFolioGrimorio,
  chaveFolioGrimorio,
  TAMANHO_FOLIO,
} from '../../services/grimorioQuery';
import { alternarOculta, excluirMagia } from '../../services/grimorioService';
import type { GrimorioSpell } from '../../mocks/grimorio';

interface UseMagiasDoGrimorioOptions {
  volumeId?: string;
  termoBusca: string;
  buscandoMagias: boolean;
  folioPage: number;
  canManageCatalog: boolean;
  canManageVisibility: boolean;
  /** Limpa a magia aberta na tela de detalhes quando ela é excluída. */
  onMagiaExcluida: (spellId: string) => void;
}

/**
 * Domínio do catálogo de magias: fólio consultado, pré-carregamento da próxima
 * página, escritas do Administrador/Mestre e o erro compartilhado das mutações.
 */
export function useMagiasDoGrimorio({
  volumeId,
  termoBusca,
  buscandoMagias,
  folioPage,
  canManageCatalog,
  canManageVisibility,
  onMagiaExcluida,
}: UseMagiasDoGrimorioOptions) {
  const queryClient = useQueryClient();
  const [erroMutacaoGrimorio, setErroMutacaoGrimorio] = useState<string | null>(null);

  const chaveConsultaGrimorio = useCallback((pagina: number) => chaveFolioGrimorio({
    volumeId,
    busca: buscandoMagias ? termoBusca : undefined,
    page: pagina,
  }), [buscandoMagias, termoBusca, volumeId]);

  const carregarPaginaGrimorio = useCallback((pagina: number) => carregarFolioGrimorio({
    volumeId,
    busca: buscandoMagias ? termoBusca : undefined,
    page: pagina,
  }), [buscandoMagias, termoBusca, volumeId]);

  const grimorioQuery = useQuery({
    queryKey: chaveConsultaGrimorio(folioPage),
    queryFn: () => carregarPaginaGrimorio(folioPage),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    enabled: buscandoMagias || Boolean(volumeId),
  });

  const isLoadingGrimorio = grimorioQuery.isLoading;
  const erroGrimorio = erroMutacaoGrimorio ?? (grimorioQuery.error
    ? `Não foi possível carregar o grimório: ${grimorioQuery.error instanceof Error ? grimorioQuery.error.message : String(grimorioQuery.error)}`
    : null);
  const spells = grimorioQuery.data?.magias ?? [];
  const hiddenSpellIds = grimorioQuery.data?.ocultas ?? [];
  const totalMagias = grimorioQuery.data?.total ?? 0;
  const bookSpells = spells.filter((spell) => canManageVisibility || !hiddenSpellIds.includes(spell.id));
  const totalFolios = Math.ceil(totalMagias / TAMANHO_FOLIO);

  useEffect(() => {
    if (grimorioQuery.isPlaceholderData || grimorioQuery.isFetching || grimorioQuery.isError || !grimorioQuery.data || folioPage >= totalFolios) return;
    const proximaPagina = folioPage + 1;
    void queryClient.prefetchQuery({
      queryKey: chaveConsultaGrimorio(proximaPagina),
      queryFn: () => carregarPaginaGrimorio(proximaPagina),
      staleTime: 5 * 60 * 1000,
    });
  }, [grimorioQuery.isPlaceholderData, grimorioQuery.isFetching, grimorioQuery.isError, grimorioQuery.data, folioPage, totalFolios, queryClient, chaveConsultaGrimorio, carregarPaginaGrimorio]);

  const executarMutacaoGrimorio = async (acao: () => Promise<void>) => {
    setErroMutacaoGrimorio(null);
    try {
      await acao();
      await queryClient.invalidateQueries({ queryKey: ['grimorio'] });
    } catch (error) {
      setErroMutacaoGrimorio(error instanceof Error ? error.message : String(error));
    }
  };

  const limparErroMutacao = () => setErroMutacaoGrimorio(null);

  const toggleHidden = (spellId: string) => {
    if (!canManageVisibility) return;
    void executarMutacaoGrimorio(() => alternarOculta(spellId, !hiddenSpellIds.includes(spellId)));
  };

  const deleteSpell = (spell: GrimorioSpell) => {
    if (!canManageCatalog || !window.confirm(`Excluir a magia "${spell.name || '-'}"? Esta ação não pode ser desfeita.`)) return;
    void executarMutacaoGrimorio(() => excluirMagia(spell.id));
    onMagiaExcluida(spell.id);
  };

  return {
    isLoadingGrimorio,
    erroGrimorio,
    bookSpells,
    hiddenSpellIds,
    totalMagias,
    totalFolios,
    recarregarGrimorio: grimorioQuery.refetch,
    limparErroMutacao,
    executarMutacaoGrimorio,
    toggleHidden,
    deleteSpell,
  };
}
