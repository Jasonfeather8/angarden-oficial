import React, { useEffect } from 'react';
import { Sparkles, WandSparkles } from 'lucide-react';
import { GothicButton } from '../GothicButton';
import { Skeleton } from '../ui/Skeleton';
import { ListaDeMagias, type AcoesDeMagia } from './ListaDeMagias';
import { agendarEmOciosidade } from '../../utils/idleCallback';
import { precarregarImagem } from '../../utils/precarregarImagem';
import { grimorioAllSchools, grimorioVolumes, type GrimorioSpell } from '../../mocks/grimorio';

const FolioSkeleton = () => (
  <section className="space-y-5" aria-hidden="true">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-7 w-56 max-w-full" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <Skeleton className="h-9 w-36" />
    </div>
    <div className="relative overflow-hidden rounded-sm border-2 border-[#654522] bg-[#2a1b0f] p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.55)] sm:p-3">
      <div className="pointer-events-none absolute inset-1 border border-[#a88d61]/40 sm:inset-2" />
      <div className="relative grid overflow-hidden border border-[#80603b] md:grid-cols-2 md:divide-x md:divide-[#80603b]">
        {[0, 1].map((page) => (
          <div key={page} className="flex min-w-0 flex-col bg-[#d4bb84] p-4 sm:p-5 lg:p-6">
            <div className="space-y-2 border-b border-[#80603b]/60 pb-3">
              <Skeleton className="mx-auto h-3 w-36" />
              <Skeleton className="mx-auto h-5 w-48 max-w-full" />
            </div>
            <div className="mt-4 flex flex-1 flex-col gap-2.5">
              {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 shrink-0 border-[#80603b]/50 bg-[#80603b]/20" />)}
            </div>
            <Skeleton className="mt-4 h-4 w-20 self-center border-transparent bg-[#80603b]/20" />
          </div>
        ))}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-[#5a3d22]/80 shadow-[0_0_8px_rgba(42,25,12,0.7)] md:block" />
      </div>
    </div>
  </section>
);

interface BookViewProps {
  carregando: boolean;
  school: typeof grimorioAllSchools[number];
  volume: typeof grimorioVolumes[number];
  spells: GrimorioSpell[];
  allBookSpells: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  acoes: AcoesDeMagia;
}

/** Livro aberto: duas páginas de fórmulas por fólio, com paginação. */
export const BookView = ({ carregando, school, volume, spells, allBookSpells, page, totalPages, onPageChange, acoes }: BookViewProps) => {
  const leftPageSpells = spells.slice(0, 5);
  const rightPageSpells = spells.slice(5, 10);
  // As primeiras magias do fólio ficam com a arte pronta para quem abre sem passar o mouse (toque/teclado).
  const alvosPreCarregamento = spells.slice(0, 3).map((spell) => spell.image ?? '').filter(Boolean).join('|');

  useEffect(() => {
    const urls = alvosPreCarregamento.split('|').filter(Boolean);
    if (!urls.length) return;
    return agendarEmOciosidade(() => urls.forEach((url) => precarregarImagem(url)));
  }, [alvosPreCarregamento]);

  if (carregando) {
    return (
      <div className="space-y-5">
        <span role="status" aria-live="polite" className="sr-only">Consultando os arquivos arcanos…</span>
        <FolioSkeleton />
      </div>
    );
  }

  const renderPage = (pageSpells: GrimorioSpell[], pageLabel: string, pageNumber: string, headingId: string) => (
    <section aria-labelledby={headingId} className="relative flex min-w-0 flex-col bg-gradient-to-br from-[#e1cc9a] via-[#d4bb84] to-[#b89862] p-4 text-[#382313] sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-2 border border-[#8d6a3e]/50" />
      <header className="relative border-b border-[#80603b]/60 pb-3 text-center">
        <div className="flex items-center justify-center gap-3 text-[#76552e]" aria-hidden="true"><span className="h-px w-10 bg-[#80603b]/60" /><Sparkles size={14} /><span className="h-px w-10 bg-[#80603b]/60" /></div>
        <p className="mt-2 text-[9px] uppercase tracking-[0.28em] text-[#76552e]">{pageLabel}</p>
        <h4 id={headingId} className="mt-1 font-cinzel text-sm uppercase tracking-[0.18em] text-[#382313]">Registro de fórmulas</h4>
      </header>
      <div className="relative mt-4 flex flex-1 flex-col gap-2.5">
        {pageSpells.length ? <ListaDeMagias spells={pageSpells} acoes={acoes} /> : <div className="flex min-h-40 flex-1 flex-col items-center justify-center border border-dashed border-[#80603b]/70 px-4 py-8 text-center"><WandSparkles className="text-[#80603b]" size={28} /><p className="mt-3 font-cinzel text-xs uppercase tracking-wider text-[#76552e]">Este volume ainda não possui fórmulas</p><p className="mt-1 text-xs text-[#76552e]/80">As páginas deste tomo estão vazias.</p></div>}
      </div>
      <footer className="relative mt-4 border-t border-[#80603b]/60 pt-2 text-center text-[9px] uppercase tracking-[0.25em] text-[#76552e]">— {pageNumber} —</footer>
    </section>
  );

  return <section aria-labelledby="book-heading" className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Livro aberto · {school.name}</p><h3 id="book-heading" className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">{volume.title}</h3><p className="mt-1 text-sm italic text-[#a79780]">{volume.subtitle} · {volume.description}</p></div><span className="border border-[#5a4225] bg-[#21170e] px-3 py-2 text-xs text-[#c6a15b]">{spells.length} de {allBookSpells} fórmulas</span></div>
    <div className="relative overflow-hidden rounded-sm border-2 border-[#654522] bg-[#2a1b0f] p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.55)] sm:p-3">
      <div className="pointer-events-none absolute inset-1 border border-[#a88d61]/40 sm:inset-2" />
      <div className="relative grid overflow-hidden border border-[#80603b] md:grid-cols-2 md:divide-x md:divide-[#80603b]">
        {renderPage(leftPageSpells, `Página esquerda · fólio ${page}`, String((page - 1) * 2 + 1), 'book-left-heading')}
        {renderPage(rightPageSpells, `Página direita · fólio ${page}`, String((page - 1) * 2 + 2), 'book-right-heading')}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-[#5a3d22]/80 shadow-[0_0_8px_rgba(42,25,12,0.7)] md:block" aria-hidden="true" />
      </div>
    </div>
    {allBookSpells > 10 && <nav aria-label="Navegação entre fólios" className="flex flex-wrap items-center justify-center gap-3">
      <GothicButton type="button" variant="secondary" size="xs" width={150} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Fólio anterior</GothicButton>
      <span className="font-cinzel text-[10px] uppercase tracking-widest text-[#c6a15b]">Fólio {page} de {totalPages}</span>
      <GothicButton type="button" variant="secondary" size="xs" width={150} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Próximo fólio</GothicButton>
    </nav>}
  </section>;
};
