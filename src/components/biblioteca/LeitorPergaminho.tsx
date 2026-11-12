import React from 'react';
import { Scroll } from 'lucide-react';
import { OverlayLeitor } from './OverlayLeitor';
import { LeitorMarkdown } from './LeitorMarkdown';
import { rotuloCategoria } from '@/config/biblioteca';
import type { ItemBiblioteca } from '@/types';

export interface LeitorPergaminhoProps {
  item: ItemBiblioteca;
  onFechar: () => void;
}

/** Lê um pergaminho: o Markdown do acervo sobre a superfície de papel antigo. */
export const LeitorPergaminho: React.FC<LeitorPergaminhoProps> = ({ item, onFechar }) => (
  <OverlayLeitor
    titulo={item.titulo}
    subtitulo={item.subtitulo ? `${rotuloCategoria(item.categoria)} · ${item.subtitulo}` : rotuloCategoria(item.categoria)}
    icone={<Scroll className="h-5 w-5" aria-hidden="true" />}
    onFechar={onFechar}
    corpoClassName="overflow-y-auto bg-[#241f18] p-3 sm:p-6"
  >
    <article className="mx-auto w-full max-w-[820px] border-2 border-[#b38b4d] bg-[#f7efe0] px-5 py-8 shadow-[0_6px_28px_rgba(0,0,0,0.55)] sm:px-10 sm:py-12">
      <header className="mb-6 border-b border-[#7a4c25]/40 pb-4 text-center">
        <h1 className="font-cinzel text-2xl font-bold uppercase tracking-wide text-[#2c1d0f]">{item.titulo}</h1>
        {item.subtitulo && <p className="mt-1 font-serif text-sm italic text-[#5a3a1d]">{item.subtitulo}</p>}
      </header>

      {item.descricao && (
        <p className="mb-6 border-l-4 border-[#b38b4d] bg-[#7a4c25]/5 px-4 py-2 font-serif text-sm italic text-[#5a3a1d]">
          {item.descricao}
        </p>
      )}

      <LeitorMarkdown conteudo={item.conteudo ?? ''} />
    </article>
  </OverlayLeitor>
);

export default LeitorPergaminho;
