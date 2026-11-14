import React from 'react';
import { Lock } from 'lucide-react';
import { BrandMark } from '../BrandMark';
import { grimorioMentalizacao } from '../../mocks/grimorio';

interface MentalizacaoTreeViewProps {
  onChooseSubcategory: (id: string) => void;
  bloqueadas: string[];
  podeAbrirBloqueada: boolean;
}

/** Caminhos mentais (subcategorias) da Mentalização. */
export const MentalizacaoTreeView = ({ onChooseSubcategory, bloqueadas, podeAbrirBloqueada }: MentalizacaoTreeViewProps) => {
  const positions = [
    { top: '20%', left: '50%', transform: 'translate(-50%, -50%)' },
    { top: '72%', left: '25%', transform: 'translate(-50%, -50%)' },
    { top: '72%', left: '75%', transform: 'translate(-50%, -50%)' },
  ];

  return (
    <section aria-labelledby="mental-tree-heading" className="space-y-6">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Árvore da mentalização</p>
        <h3 id="mental-tree-heading" className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">Escolha um caminho mental</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm italic text-[#9f9077]">Cada círculo guarda os três volumes de uma subcategoria.</p>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[580px] overflow-hidden rounded-full border border-[#4d3822] bg-[radial-gradient(circle_at_center,rgba(72,91,133,0.25),transparent_58%),#0e0a07] shadow-[inset_0_0_45px_rgba(0,0,0,0.7)] max-[639px]:max-w-[360px]" aria-label="Círculo de subcategorias da Mentalização">
        <div className="pointer-events-none absolute inset-[6%] rounded-full border border-[#6b4f2d]/70" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[20%] rounded-full border border-dashed border-[#8c6b41]/35" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-[56%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,184,107,0.16),transparent_68%)]" aria-hidden="true" />
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="#8c6b41" strokeOpacity="0.55" strokeWidth="0.4" strokeDasharray="0.7 21.29" />
          <line x1="50" y1="20" x2="25" y2="72" stroke="#9b7748" strokeWidth="0.4" strokeOpacity="0.72" />
          <line x1="50" y1="20" x2="75" y2="72" stroke="#9b7748" strokeWidth="0.4" strokeOpacity="0.72" />
          <line x1="25" y1="72" x2="75" y2="72" stroke="#9b7748" strokeWidth="0.4" strokeOpacity="0.72" />
        </svg>
        <div className="absolute left-1/2 top-1/2 z-10 flex size-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#c6a15b]/70 bg-[#1a110a] px-2 text-center shadow-[0_0_30px_rgba(216,184,107,0.25)] sm:size-[112px]" aria-hidden="true">
          <BrandMark variant="arvore" altura={32} decorativa className="mb-1" />
          <span className="block max-w-full break-words font-cinzel text-[8px] uppercase leading-[1.05] tracking-[0.15em] text-[#d8b86b] sm:text-[9px]">Mentalização</span>
        </div>
        {grimorioMentalizacao.map((item, index) => {
          const bloqueada = bloqueadas.includes(item.id);
          return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChooseSubcategory(item.id)}
            aria-disabled={bloqueada && !podeAbrirBloqueada}
            aria-label={`Escolher ${item.name}${bloqueada ? ' — Selado pelo Mestre' : ''}`}
            title={bloqueada ? 'Selado pelo Mestre' : item.description}
            style={{ ...positions[index], borderColor: item.accent }}
            className="absolute z-20 flex size-[112px] flex-col items-center justify-center rounded-full border-2 bg-[#17100b] px-2 text-center shadow-[0_0_18px_rgba(0,0,0,0.7)] transition hover:scale-105 hover:bg-[#2a1d12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] focus-visible:outline-offset-2 max-[639px]:size-[76px] max-[639px]:px-1"
          >
            {bloqueada && <Lock className="absolute right-2 top-2 h-4 w-4 text-[#d6b56a] max-[639px]:right-1 max-[639px]:top-1 max-[639px]:h-3 max-[639px]:w-3" aria-hidden="true" />}
            <span className="block break-words font-cinzel text-[10px] uppercase leading-tight tracking-wide text-[#eadfc8] max-[639px]:text-[8px]">{item.name}</span>
            <span className="mt-1 block break-words text-[9px] italic leading-tight text-[#c6a15b] max-[639px]:text-[7px]">({item.subtitle})</span>
          </button>
          );
        })}
      </div>
    </section>
  );
};
