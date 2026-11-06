import type { CategoriaMercado } from '../types';
import { mercadoService } from './mercadoService';
import { withTimeout } from '../utils/withTimeout';

export const TAMANHO_PAGINA_MERCADO = 10;
export const CATEGORIA_INICIAL_DO_MERCADO: CategoriaMercado = 'mercado_armas';
export const SUBCATEGORIA_INICIAL_DO_MERCADO = 'todas';

export interface PaginaMercadoParams {
  categoria: CategoriaMercado;
  subcategoria: string;
  busca: string;
  page: number;
}

export function chavePaginaMercado({ categoria, subcategoria, busca, page }: PaginaMercadoParams) {
  return ['mercado', { categoria, subcategoria, busca, page, pageSize: TAMANHO_PAGINA_MERCADO }] as const;
}

export function carregarPaginaMercado({ categoria, subcategoria, busca, page }: PaginaMercadoParams) {
  return withTimeout(mercadoService.listarItens({
    categoria,
    subcategoria,
    busca,
    page,
    pageSize: TAMANHO_PAGINA_MERCADO,
  }));
}

export function paginaInicialDoMercado(): PaginaMercadoParams {
  return {
    categoria: CATEGORIA_INICIAL_DO_MERCADO,
    subcategoria: SUBCATEGORIA_INICIAL_DO_MERCADO,
    busca: '',
    page: 1,
  };
}
