import React from 'react';
import { CardMaterialBiblioteca } from '@/components/biblioteca/CardMaterialBiblioteca';
import type { EstanteBiblioteca } from '@/components/biblioteca/useAcervoBiblioteca';
import { EmptyState } from '@/components/ui/EmptyState';
import type { ItemBiblioteca } from '@/types';

export interface EstantesDaBibliotecaProps {
  estantes: EstanteBiblioteca[];
  onAbrir: (item: ItemBiblioteca) => void;
  onLimparFiltros: () => void;
}

/**
 * Estantes do acervo, agrupadas por seção. Quando o filtro não devolve nada, a
 * própria estante oferece o caminho de volta (limpar filtros).
 */
export const EstantesDaBiblioteca: React.FC<EstantesDaBibliotecaProps> = ({
  estantes,
  onAbrir,
  onLimparFiltros,
}) => {
  if (estantes.length === 0) {
    return (
      <EmptyState
        variant="plano"
        title="Nenhum material encontrado"
        description="Ajuste a busca ou escolha outra categoria para ver o restante do acervo."
        action={
          <button
            type="button"
            onClick={onLimparFiltros}
            className="border border-[#8c6b41] bg-[#241a11] px-3 py-2 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#d8bd83] transition-colors hover:border-[#d1a85a] hover:text-[#f0d79b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
          >
            Limpar filtros
          </button>
        }
      />
    );
  }

  return (
    <>
      {estantes.map(({ grupo, itens }) => (
        <section key={grupo.id} aria-labelledby={`estante-${grupo.id}`} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3
              id={`estante-${grupo.id}`}
              className="font-cinzel text-sm font-bold uppercase tracking-[0.16em] text-[#d1a85a]"
            >
              {grupo.label}
            </h3>
            <span className="h-px flex-1 bg-[#3a2c1d]" aria-hidden="true" />
            <span className="font-serif text-xs italic text-[#80613d]">
              {itens.length} volume(s)
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {itens.map((item) => (
              <CardMaterialBiblioteca key={item.id} item={item} onAbrir={() => onAbrir(item)} />
            ))}
          </div>
        </section>
      ))}
    </>
  );
};

export default EstantesDaBiblioteca;
