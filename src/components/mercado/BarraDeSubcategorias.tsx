import React from 'react';
import { Layers } from 'lucide-react';
import type { SubcategoriaMercado } from './catalogoMercado';

interface BarraDeSubcategoriasProps {
  subcategorias: SubcategoriaMercado[];
  subcategoriaAtiva: string;
  rotuloCategoria?: string;
  onSelecionar: (subcategoriaId: string) => void;
}

/**
 * Subcategorias visíveis da categoria selecionada no catálogo.
 * Categorias sem subcategorias não renderizam a faixa.
 */
export const BarraDeSubcategorias: React.FC<BarraDeSubcategoriasProps> = ({
  subcategorias,
  subcategoriaAtiva,
  rotuloCategoria,
  onSelecionar,
}) => {
  if (subcategorias.length === 0) return null;

  return (
    <div className="space-y-2 bg-[#0c0806]/90 border border-[#5a4225] p-2.5 sm:p-3.5 rounded-xs shadow-[0_0_15px_rgba(0,0,0,0.7)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div className="flex items-center gap-2">
          <Layers size={14} className="text-[#a88d61] shrink-0" />
          <span className="text-[11px] sm:text-xs font-cinzel uppercase tracking-wider text-[#e6ddc5] font-bold truncate">
            Subcategorias &bull; {rotuloCategoria}
          </span>
        </div>
        <span className="text-[10px] sm:text-[11px] text-[#8c6b41] font-serif italic">
          Filtre por especialidade de combate
        </span>
      </div>

      {/* Barra de Seletores de Subcategoria - Suporte a scroll horizontal suave no mobile */}
      <div className="flex sm:flex-wrap items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
        {subcategorias.map((sub) => {
          const isSelected = subcategoriaAtiva === sub.id;
          return (
            <button
              key={sub.id}
              type="button"
              id={`subcat-btn-${sub.id.replace(/\s+/g, '-').toLowerCase()}`}
              onClick={() => onSelecionar(sub.id)}
              className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xs border transition-colors text-[11px] sm:text-xs font-cinzel cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#3a2818] border-[#8c6b41] text-[#f2dfa8] shadow-[0_0_10px_rgba(140,107,65,0.35)] font-bold'
                  : 'bg-[#120f0d]/90 border-[#5a4225] text-[#8c6b41] hover:text-[#e6ddc5] hover:border-[#8c6b41]'
              }`}
            >
              <span className="whitespace-nowrap">{sub.label}</span>
              {sub.sigla && (
                <span className={`text-[9px] font-mono px-1 py-0.2 rounded-xs border ${
                  isSelected 
                    ? 'bg-[#1a140e] border-[#8c6b41] text-[#f2dfa8]' 
                    : 'bg-[#1a140e] border-[#3a2818] text-[#8c6b41]'
                }`}>
                  {sub.sigla}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BarraDeSubcategorias;
