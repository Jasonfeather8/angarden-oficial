import { useCallback, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CATEGORIA_INICIAL_DO_MERCADO,
  SUBCATEGORIA_INICIAL_DO_MERCADO,
  TAMANHO_PAGINA_MERCADO,
  carregarPaginaMercado as carregarPaginaDoCatalogo,
  chavePaginaMercado,
} from '../../services/mercadoQuery';
import type { CategoriaMercado } from '../../types';
import {
  CATEGORIA_INICIAL_POR_SECAO,
  SUBCATEGORIAS_POR_CATEGORIA,
  TABS_POR_SECAO,
  derivarThemeMode,
  type SecaoMercado,
} from './catalogoMercado';

/**
 * Domínio do catálogo: seção, categoria, subcategoria e busca ativas, paginação
 * e a consulta paginada do catálogo global (com pré-carregamento da próxima página).
 */
export function useCatalogoDoMercado() {
  // Seção Geral do Mercado ('arsenal' | 'comum' | 'epico' | 'arcano')
  const [secaoMercado, setSecaoMercado] = useState<SecaoMercado>('arsenal');

  // Categoria ativa no seletor
  const [activeCategory, setActiveCategory] = useState<CategoriaMercado>(CATEGORIA_INICIAL_DO_MERCADO);

  // Subcategoria ativa na categoria selecionada
  const [subcategoriaAtiva, setSubcategoriaAtiva] = useState<string>(SUBCATEGORIA_INICIAL_DO_MERCADO);

  const [busca, setBusca] = useState<string>('');
  const [buscaDebounced, setBuscaDebounced] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = TAMANHO_PAGINA_MERCADO;
  const queryClient = useQueryClient();

  const chaveConsultaMercado = useCallback((pagina: number) => chavePaginaMercado({
    categoria: activeCategory,
    subcategoria: subcategoriaAtiva,
    busca: buscaDebounced,
    page: pagina,
  }), [activeCategory, subcategoriaAtiva, buscaDebounced]);

  const carregarPaginaMercado = useCallback((pagina: number) => carregarPaginaDoCatalogo({
    categoria: activeCategory,
    subcategoria: subcategoriaAtiva,
    busca: buscaDebounced,
    page: pagina,
  }), [activeCategory, subcategoriaAtiva, buscaDebounced]);

  const selecionarCategoria = useCallback((catId: string) => {
    setActiveCategory(catId as CategoriaMercado);
    setSubcategoriaAtiva('todas');
    setBusca('');
  }, []);

  const trocarSecao = useCallback((secao: SecaoMercado) => {
    setSecaoMercado(secao);
    setActiveCategory(CATEGORIA_INICIAL_POR_SECAO[secao]);
    setSubcategoriaAtiva('todas');
    setBusca('');
  }, []);

  const selecionarSubcategoria = useCallback((subcategoriaId: string) => {
    setSubcategoriaAtiva(subcategoriaId);
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, subcategoriaAtiva, busca]);

  const {
    data: paginaMercado,
    isLoading: carregandoItens,
    isFetching: buscandoItens,
    isError: erroItens,
    error: erroConsulta,
    refetch: recarregarItens,
    isPlaceholderData,
  } = useQuery({
    queryKey: chaveConsultaMercado(page),
    queryFn: () => carregarPaginaMercado(page),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const itens = paginaMercado?.itens ?? [];
  const totalItens = paginaMercado?.total ?? 0;
  const totalPaginas = Math.ceil(totalItens / pageSize);

  useEffect(() => {
    if (isPlaceholderData || carregandoItens || buscandoItens || !paginaMercado || page >= totalPaginas) return;
    const proximaPagina = page + 1;
    void queryClient.prefetchQuery({
      queryKey: chaveConsultaMercado(proximaPagina),
      queryFn: () => carregarPaginaMercado(proximaPagina),
      staleTime: 5 * 60 * 1000,
    });
  }, [isPlaceholderData, carregandoItens, buscandoItens, paginaMercado, page, totalPaginas, queryClient, chaveConsultaMercado, carregarPaginaMercado]);

  useEffect(() => {
    if (!isPlaceholderData && !carregandoItens && totalPaginas > 0 && page > totalPaginas) {
      setPage(totalPaginas);
    }
  }, [isPlaceholderData, carregandoItens, totalPaginas, page]);

  // As tabs exibidas dependem da seção selecionada no mercado
  const tabsConfig = useMemo(() => {
    return TABS_POR_SECAO[secaoMercado] || TABS_POR_SECAO.arsenal;
  }, [secaoMercado]);

  const categoriaAtivaInfo = tabsConfig.find((t) => t.id === activeCategory);
  const subcategoriasAtuais = SUBCATEGORIAS_POR_CATEGORIA[activeCategory] || [];

  // Modo de estilo e estética ('default' | 'epico' | 'arcano')
  const themeMode = useMemo(
    () => derivarThemeMode(secaoMercado, activeCategory),
    [secaoMercado, activeCategory]
  );

  const paginaAnterior = useCallback(() => setPage((current) => Math.max(1, current - 1)), []);
  const proximaPagina = useCallback(
    () => setPage((current) => Math.min(totalPaginas, current + 1)),
    [totalPaginas]
  );

  // Descarta o cache do catálogo após qualquer escrita do Administrador
  const invalidarCatalogo = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['mercado'] }),
    [queryClient]
  );

  return {
    secaoMercado,
    activeCategory,
    subcategoriaAtiva,
    busca,
    page,
    pageSize,
    itens,
    totalItens,
    totalPaginas,
    carregandoItens,
    buscandoItens,
    erroItens,
    erroConsulta,
    isPlaceholderData,
    recarregarItens,
    tabsConfig,
    categoriaAtivaInfo,
    subcategoriasAtuais,
    themeMode,
    selecionarCategoria,
    selecionarSubcategoria,
    trocarSecao,
    setBusca,
    paginaAnterior,
    proximaPagina,
    invalidarCatalogo,
  };
}
