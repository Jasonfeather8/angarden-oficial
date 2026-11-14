import React from 'react';
import { Search, X } from 'lucide-react';
import { CATEGORIAS_BIBLIOTECA } from '@/config/biblioteca';

export interface FiltrosDaBibliotecaProps {
  termo: string;
  categoriaFiltro: string | null;
  onTermoChange: (termo: string) => void;
  onLimparTermo: () => void;
  onCategoriaChange: (categoria: string | null) => void;
}

/**
 * Busca e categoria da estante. A busca é digitada aqui e resolvida no banco
 * (com espera); os botões de categoria funcionam como filtro único.
 */
export const FiltrosDaBiblioteca: React.FC<FiltrosDaBibliotecaProps> = ({
  termo,
  categoriaFiltro,
  onTermoChange,
  onLimparTermo,
  onCategoriaChange,
}) => (
  <div className="space-y-3">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center border border-[#4b3823] bg-[#0e0a07]">
        <label htmlFor="busca-acervo" className="sr-only">
          Buscar no acervo
        </label>
        <Search className="m-2 h-4 w-4 shrink-0 text-[#8c6b41]" aria-hidden="true" />
        <input
          id="busca-acervo"
          type="search"
          value={termo}
          onChange={(evento) => onTermoChange(evento.target.value)}
          placeholder="Buscar por título, subtítulo ou descrição"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 font-serif text-sm text-[#e6ddc5] placeholder:text-[#756044] focus:outline-none"
        />
        {termo && (
          <button
            type="button"
            onClick={onLimparTermo}
            title="Limpar busca"
            aria-label="Limpar busca"
            className="border-l border-[#4b3823] px-2 py-2 text-[#9e8052] transition-colors hover:bg-[#2d1e12] hover:text-[#e0bd71] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onCategoriaChange(null)}
        aria-pressed={categoriaFiltro === null}
        className={`border px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] ${
          categoriaFiltro === null
            ? 'border-[#a88d61] bg-[#2a1d10] text-[#f3ebd3]'
            : 'border-[#4b3823] bg-[#0e0a07] text-[#a88d61] hover:border-[#8c6b41] hover:text-[#e6ddc5]'
        }`}
      >
        Todo o acervo
      </button>
      {CATEGORIAS_BIBLIOTECA.map((categoria) => (
        <button
          key={categoria.id}
          type="button"
          onClick={() => onCategoriaChange(categoria.id)}
          aria-pressed={categoriaFiltro === categoria.id}
          className={`border px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] ${
            categoriaFiltro === categoria.id
              ? 'border-[#a88d61] bg-[#2a1d10] text-[#f3ebd3]'
              : 'border-[#4b3823] bg-[#0e0a07] text-[#a88d61] hover:border-[#8c6b41] hover:text-[#e6ddc5]'
          }`}
        >
          {categoria.label}
        </button>
      ))}
    </div>
  </div>
);

export default FiltrosDaBiblioteca;
