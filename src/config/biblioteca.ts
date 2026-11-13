/**
 * Fonte única da taxonomia da Biblioteca. O banco guarda o id da categoria
 * (há um check que só aceita estes valores); as telas usam o rótulo.
 */
export interface CategoriaBiblioteca {
  id: string;
  label: string;
}

export interface GrupoBiblioteca {
  id: string;
  label: string;
  categorias: CategoriaBiblioteca[];
}

/**
 * As sete categorias do acervo. "Regras" é o único grupo com mais de uma
 * categoria dentro, e por isso a estante mostra um cabeçalho só para ele.
 */
export const GRUPOS_BIBLIOTECA: GrupoBiblioteca[] = [
  {
    id: 'regras',
    label: 'Regras',
    categorias: [
      { id: 'livro-de-regras', label: 'Livro de Regras' },
      { id: 'livro-do-jogador', label: 'Livro do Jogador' },
    ],
  },
  { id: 'suplementos', label: 'Suplementos', categorias: [{ id: 'suplementos', label: 'Suplementos' }] },
  { id: 'aventuras', label: 'Aventuras', categorias: [{ id: 'aventuras', label: 'Aventuras' }] },
  { id: 'ambientacao', label: 'Ambientação', categorias: [{ id: 'ambientacao', label: 'Ambientação' }] },
  { id: 'historia', label: 'História', categorias: [{ id: 'historia', label: 'História' }] },
  { id: 'bestiario', label: 'Bestiário', categorias: [{ id: 'bestiario', label: 'Bestiário' }] },
];

export const CATEGORIAS_BIBLIOTECA: CategoriaBiblioteca[] = GRUPOS_BIBLIOTECA.flatMap(
  (grupo) => grupo.categorias,
);

export const rotuloCategoria = (id: string): string =>
  CATEGORIAS_BIBLIOTECA.find((categoria) => categoria.id === id)?.label ?? id;

/** Grupo a que a categoria pertence; a estante agrupa o acervo por ele. */
export const grupoDaCategoria = (id: string): string =>
  GRUPOS_BIBLIOTECA.find((grupo) => grupo.categorias.some((categoria) => categoria.id === id))?.id ?? '';

export function formatarTamanhoArquivo(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} MB`;
}
