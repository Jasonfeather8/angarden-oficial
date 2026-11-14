import React from 'react';
import { GothicButton } from '../GothicButton';
import { EmptyState } from '../ui/EmptyState';
import { Skeleton } from '../ui/Skeleton';
import { ListaDeMagias, type AcoesDeMagia } from './ListaDeMagias';
import { pluralizarMagias } from './formatters';
import type { GrimorioSpell } from '../../mocks/grimorio';

const FolioListaSkeleton = () => (
  <div className="space-y-3" aria-hidden="true">
    {Array.from({ length: 10 }).map((_, index) => <Skeleton key={index} className="h-24" />)}
  </div>
);

interface ResultadosDaBuscaProps {
  carregando: boolean;
  termoBusca: string;
  totalMagias: number;
  spells: GrimorioSpell[];
  folioPage: number;
  totalFolios: number;
  onPageChange: (page: number) => void;
  onLimparBusca: () => void;
  acoes: AcoesDeMagia;
}

/** Resultados da busca textual em todos os volumes do Grimório. */
export const ResultadosDaBusca = ({ carregando, termoBusca, totalMagias, spells, folioPage, totalFolios, onPageChange, onLimparBusca, acoes }: ResultadosDaBuscaProps) => {
  if (carregando) {
    return (
      <div className="space-y-4">
        <span role="status" aria-live="polite" className="sr-only">Consultando os arquivos arcanos…</span>
        <FolioListaSkeleton />
      </div>
    );
  }

  return (
    <section aria-labelledby="grimorio-search-results" className="space-y-4">
      <p id="grimorio-search-results" className="border-b border-[#3a2c1d] pb-3 text-xs text-[#a88d61]" role="status">
        Resultados da busca em todos os volumes para <strong className="text-[#e6ddc5]">“{termoBusca}”</strong> · {totalMagias} {pluralizarMagias(totalMagias)}
      </p>
      {totalMagias === 0 ? (
        <EmptyState
          variant="plano"
          title="Nenhuma magia encontrada"
          description="Não há fórmulas que correspondam a esta busca."
          action={<button type="button" onClick={onLimparBusca} className="text-xs uppercase tracking-widest text-[#d6b56a] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]">Limpar busca</button>}
        />
      ) : (
        <>
          <div className="space-y-3">
            <ListaDeMagias spells={spells} acoes={acoes} />
          </div>
          {totalFolios > 1 && <nav aria-label="Navegação entre páginas dos resultados da busca" className="flex flex-wrap items-center justify-center gap-3">
            <GothicButton type="button" variant="secondary" size="xs" width={150} disabled={folioPage <= 1} onClick={() => onPageChange(folioPage - 1)}>Página anterior</GothicButton>
            <span className="font-cinzel text-[10px] uppercase tracking-widest text-[#c6a15b]">Página {folioPage} de {totalFolios}</span>
            <GothicButton type="button" variant="secondary" size="xs" width={150} disabled={folioPage >= totalFolios} onClick={() => onPageChange(folioPage + 1)}>Próxima página</GothicButton>
          </nav>}
        </>
      )}
    </section>
  );
};
