import { bibliotecaService, type FiltrosAcervo } from './bibliotecaService';
import { withTimeout } from '../utils/withTimeout';

/**
 * Parâmetros da consulta do acervo. O papel entra na chave porque o
 * Administrador enxerga também os materiais ocultos: o mesmo filtro devolve
 * conjuntos diferentes para papéis diferentes.
 */
export interface AcervoBibliotecaParams {
  papel: string | null;
  categoria: string | null;
  termo: string;
}

export function chaveAcervoBiblioteca({ papel, categoria, termo }: AcervoBibliotecaParams) {
  return ['biblioteca', 'acervo', { papel, categoria, termo }] as const;
}

export function carregarAcervoBiblioteca({ categoria, termo }: AcervoBibliotecaParams) {
  const filtros: FiltrosAcervo = { categoria, termo };
  return withTimeout(bibliotecaService.listarAcervo(filtros));
}
