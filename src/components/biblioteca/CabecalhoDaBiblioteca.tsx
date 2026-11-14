import React from 'react';
import { Scroll } from 'lucide-react';
import { ToolbarButton } from '@/components/ui/ToolbarButton';

export interface CabecalhoDaBibliotecaProps {
  /** Quantidade de volumes na resposta atual. */
  total: number;
  filtroAtivo: boolean;
  isFetching: boolean;
  isLoading: boolean;
  podeGerenciar: boolean;
  onGerenciar: () => void;
}

/**
 * Faixa de resumo da estante: apresenta o acervo, o total de volumes e a ação
 * de gestão (só para quem pode publicar).
 */
export const CabecalhoDaBiblioteca: React.FC<CabecalhoDaBibliotecaProps> = ({
  total,
  filtroAtivo,
  isFetching,
  isLoading,
  podeGerenciar,
  onGerenciar,
}) => (
  <div className="flex flex-col gap-3 border-b border-[#3a2c1d] pb-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <p className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">
        Acervo de Angarden
      </p>
      <p className="mt-1 max-w-2xl font-serif text-sm text-[#a99c84]">
        Escolha um tomo para consultar suas regras e referências durante a aventura.
      </p>
    </div>
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-serif text-xs italic text-[#80613d]">
        {filtroAtivo
          ? `${total} volume(s) encontrado(s)`
          : `${total} volume(s) catalogado(s)`}
      </span>
      {isFetching && !isLoading && (
        <span className="font-serif text-xs italic text-[#d1a85a]" role="status" aria-live="polite">
          Buscando…
        </span>
      )}
      {podeGerenciar && (
        <ToolbarButton icon={<Scroll className="h-4 w-4" />} onClick={onGerenciar}>
          Gerenciar acervo
        </ToolbarButton>
      )}
    </div>
  </div>
);

export default CabecalhoDaBiblioteca;
