import React from 'react';
import { clsx } from 'clsx';
import { Settings2 } from 'lucide-react';
import type { CategoriaCronica } from '@/types';

export type FiltroDeCategoriasAtivo = 'todas' | 'sem' | string;

export interface FiltroDeCategoriasProps {
  categorias: CategoriaCronica[];
  ativo: FiltroDeCategoriasAtivo;
  /** Quantas crônicas por categoria; a chave `sem` conta as sem categoria. */
  contagens: Record<string, number>;
  onSelecionar: (valor: FiltroDeCategoriasAtivo) => void;
  /** Presente apenas para o Mestre autor. */
  onGerir?: () => void;
}

/** Chips de categoria da estante de crônicas. */
export const FiltroDeCategorias: React.FC<FiltroDeCategoriasProps> = ({
  categorias,
  ativo,
  contagens,
  onSelecionar,
  onGerir,
}) => {
  const total = Object.keys(contagens).reduce((soma, chave) => soma + (contagens[chave] ?? 0), 0);
  const chips = [
    { id: 'todas', label: 'Todas', contagem: total },
    ...categorias.map((categoria) => ({
      id: categoria.id,
      label: categoria.nome,
      contagem: contagens[categoria.id] ?? 0,
    })),
    { id: 'sem', label: 'Sem categoria', contagem: contagens.sem ?? 0 },
  ];

  return (
    <nav aria-label="Filtrar crônicas por categoria" className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((chip) => {
        const selecionado = ativo === chip.id;
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={selecionado}
            onClick={() => onSelecionar(chip.id)}
            className={clsx(
              'rounded-sm border px-3 py-1.5 font-cinzel text-[10px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]',
              selecionado
                ? 'border-[#b89558] bg-[#2a1d10] text-[#f0d79b]'
                : 'border-[#4b3823] bg-[#120d09] text-[#a88d61] hover:border-[#8c6b41]',
            )}
          >
            {chip.label} <span className="ml-1 text-[#806b53]">{chip.contagem}</span>
          </button>
        );
      })}

      {onGerir && (
        <button
          type="button"
          onClick={onGerir}
          aria-label="Gerenciar categorias"
          className="inline-flex min-h-8 items-center gap-1.5 border border-[#4b3823] px-3 font-cinzel text-[10px] uppercase tracking-wider text-[#c6a66d] transition-colors hover:border-[#a88d61] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Gerir categorias
        </button>
      )}
    </nav>
  );
};

export default FiltroDeCategorias;
