import React from 'react';
import { ChevronRight, FileText, Scroll } from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { formatarTamanhoArquivo } from '@/config/biblioteca';
import type { ItemBiblioteca } from '@/types';

const focusRing = 'focus:outline-none focus:ring-2 focus:ring-[#d1a85a] focus:ring-offset-2 focus:ring-offset-[#15100b]';

export interface CardMaterialBibliotecaProps {
  item: ItemBiblioteca;
  onAbrir: () => void;
}

/** Volume na estante: capa, título e o convite para abrir o material. */
export const CardMaterialBiblioteca: React.FC<CardMaterialBibliotecaProps> = ({ item, onAbrir }) => (
  <button
    type="button"
    onClick={onAbrir}
    aria-label={`Abrir ${item.titulo}`}
    className={`group flex h-full flex-col overflow-hidden border border-[#4b3823] bg-[#17110c] text-left shadow-[0_8px_18px_rgba(0,0,0,0.3)] transition-all duration-200 hover:-translate-y-1 hover:border-[#a88d61] hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)] ${focusRing}`}
  >
    <div className="relative aspect-[3/4] w-full overflow-hidden border-b border-[#4b3823] bg-[#2a1b13]">
      {item.capaUrl ? (
        <img
          src={item.capaUrl}
          alt={`Capa de ${item.titulo}`}
          className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-95"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[#8c6b41]">
          {item.tipo === 'pdf' ? (
            <FileText className="h-10 w-10" aria-hidden="true" />
          ) : (
            <Scroll className="h-10 w-10" aria-hidden="true" />
          )}
        </span>
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#120c08] via-[#1a110c]/35 to-[#110c08]/30" />

      <div className="absolute inset-x-4 top-4 flex justify-center border border-[#d1a85a]/60 px-2 py-1 text-center">
        <BrandMark variant="completa" altura={13} larguraMaxima={110} decorativa />
      </div>

      <div className="absolute inset-x-4 bottom-4">
        <p className="font-cinzel text-base font-bold uppercase leading-tight tracking-wider text-[#f0e2c0] drop-shadow-[1px_1px_2px_#000]">
          {item.titulo}
        </p>
        {item.subtitulo && <p className="mt-1 font-serif text-xs italic text-[#c9b88e]">{item.subtitulo}</p>}
      </div>

      <span className="absolute right-3 top-3 rounded-full border border-[#d1a85a]/60 bg-[#120c08]/80 p-1.5 text-[#e0bd71] opacity-0 transition-opacity group-hover:opacity-100">
        {item.tipo === 'pdf' ? <FileText className="h-3.5 w-3.5" /> : <Scroll className="h-3.5 w-3.5" />}
      </span>

      {item.oculto && (
        <span className="absolute left-3 top-3 border border-[#d1a85a]/70 bg-[#120c08]/85 px-1.5 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-[#e0bd71]">
          Oculto
        </span>
      )}
    </div>

    <div className="flex flex-1 flex-col p-4">
      {item.descricao && <p className="font-serif text-xs leading-relaxed text-[#a99c84]">{item.descricao}</p>}
      <span className="mt-4 flex items-center justify-between gap-2 font-cinzel text-[10px] font-bold uppercase tracking-widest text-[#b89558] transition-colors group-hover:text-[#e1c681]">
        {item.tipo === 'pdf'
          ? `Ler manual${item.arquivoBytes ? ` · ${formatarTamanhoArquivo(item.arquivoBytes)}` : ''}`
          : 'Ler pergaminho'}
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
      </span>
    </div>
  </button>
);

export default CardMaterialBiblioteca;
