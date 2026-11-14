import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { SubcategoriaMercado } from './catalogoMercado';

interface BarraDeBuscaDoCatalogoProps {
  rotuloCategoria?: string;
  subcategorias: SubcategoriaMercado[];
  subcategoriaAtiva: string;
  totalItens: number;
  buscandoItens: boolean;
  busca: string;
  onBuscaChange: (valor: string) => void;
}

/** Barra de pesquisa e status do catálogo da categoria ativa. */
export const BarraDeBuscaDoCatalogo: React.FC<BarraDeBuscaDoCatalogoProps> = ({
  rotuloCategoria,
  subcategorias,
  subcategoriaAtiva,
  totalItens,
  buscandoItens,
  busca,
  onBuscaChange,
}) => (
  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-[#0c0806]/90 border border-[#5a4225] px-3 sm:px-4 py-2.5 rounded-xs shadow-[0_0_15px_rgba(0,0,0,0.7)]">
    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#a88d61] font-cinzel uppercase tracking-wider flex-wrap">
      <span className="w-2 h-2 rounded-full bg-[#8c6b41] animate-pulse shrink-0" />
      <span>
        Catálogo: <strong className="text-[#f2dfa8]">{rotuloCategoria}</strong>
        {subcategoriaAtiva !== 'todas' && (
          <span className="text-[#dcd1ba]"> &bull; {subcategorias.find(s => s.id === subcategoriaAtiva)?.label}</span>
        )}
      </span>
      <span className="text-[#8c6b41] font-serif text-[10px] sm:text-xs italic">({totalItens} itens)</span>
      {buscandoItens && (
        <span role="status" className="inline-flex items-center">
          <Loader2 className="h-3 w-3 animate-spin text-[#a88d61]" aria-hidden="true" />
          <span className="sr-only">Atualizando o catálogo…</span>
        </span>
      )}
    </div>

    {/* Input de Busca */}
    <div className="relative w-full sm:w-64">
      <Search size={14} className="text-[#8c6b41] absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={busca}
        onChange={(e) => onBuscaChange(e.target.value)}
        placeholder="Pesquisar por nome, material..."
        className="w-full bg-[#120f0d]/90 border border-[#5a4225] focus:border-[#a88d61] text-[#e6ddc5] placeholder-[#8c6b41] text-xs font-serif pl-8 pr-3 py-1.5 sm:py-1.5 rounded-xs outline-none transition-colors"
      />
    </div>
  </div>
);

export default BarraDeBuscaDoCatalogo;
