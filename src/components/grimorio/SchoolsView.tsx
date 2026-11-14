import React from 'react';
import { Lock, Plus } from 'lucide-react';
import { BrandMark } from '../BrandMark';
import { grimorioSchools } from '../../mocks/grimorio';
import { CirculosExpandidos } from './CirculosExpandidos';

interface SchoolsViewProps {
  onChoose: (schoolId: string, branch?: string) => void;
  onCreate?: () => void;
  bloqueadas: string[];
  podeAbrirBloqueada: boolean;
}

/** Círculo Menor: as escolas de entrada do Grimório. */
export const SchoolsView = ({ onChoose, onCreate, bloqueadas, podeAbrirBloqueada }: SchoolsViewProps) => {
  return (
    <>
      <section aria-labelledby="schools-heading" className="space-y-5 max-[639px]:space-y-7">
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3"><div><p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Círculo de conhecimento</p><h3 id="schools-heading" className="mt-1 font-cinzel text-lg uppercase tracking-wider text-[#e6ddc5]">Escolha uma escola arcana</h3></div><p className="max-w-none text-left text-xs italic text-[#8f806a] sm:max-w-xs sm:text-right">Cada círculo guarda três volumes de fórmulas e segredos.</p></div>
    <div className="relative mx-auto flex aspect-square w-full max-w-[580px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,rgba(216,184,107,0.16),transparent_58%),#0c0907] shadow-[0_0_50px_rgba(0,0,0,0.8)] max-[639px]:my-2 max-[639px]:max-w-[360px]">
      <div className="absolute inset-[6%] rounded-full border border-[#6b4f2d]/70" /><div className="absolute inset-[16%] rounded-full border border-[#8c6b41]/60" /><div className="absolute inset-[29%] rotate-45 border border-[#8c6b41]/40" /><div className="absolute inset-[29%] -rotate-45 border border-[#8c6b41]/40" /><div className="absolute left-1/2 top-[10%] h-[80%] w-px bg-[#6b4f2d]/40" /><div className="absolute left-[10%] top-1/2 h-px w-[80%] bg-[#6b4f2d]/40" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-[42%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,184,107,0.14),transparent_68%)]" aria-hidden="true" />
      <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <circle cx="50" cy="50" r="43" fill="none" stroke="#8c6b41" strokeOpacity="0.5" strokeWidth="0.35" strokeDasharray="0.7 21.81" />
        {[{ x: 29, y: 29 }, { x: 71, y: 29 }, { x: 71, y: 71 }, { x: 29, y: 71 }, { x: 50, y: 29 }, { x: 71, y: 50 }, { x: 50, y: 71 }, { x: 29, y: 50 }].map((ponto) => <circle key={`escola-no-${ponto.x}-${ponto.y}`} cx={ponto.x} cy={ponto.y} r="0.7" fill="#d8b86b" fillOpacity="0.5" />)}
      </svg>
      <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-[#a88d61] bg-[#1a110a] text-center shadow-[0_0_25px_rgba(168,141,97,0.2)] max-[639px]:h-20 max-[639px]:w-20"><BrandMark variant="arvore" altura={30} decorativa className="mb-1" /><span className="font-cinzel text-[11px] uppercase tracking-widest text-[#e6ddc5] max-[639px]:text-[9px]">Círculo Menor</span></div>
      {grimorioSchools.map((item, index) => {
        const position = [{ top: '2%', left: '50%', transform: 'translateX(-50%)' }, { top: '19%', right: '3%' }, { top: '61%', right: '3%' }, { bottom: '2%', left: '50%', transform: 'translateX(-50%)' }, { top: '61%', left: '3%' }, { top: '19%', left: '3%' }, { top: '41%', left: '50%', transform: 'translate(-50%, -50%)' }][index];
        const bloqueada = bloqueadas.includes(item.id);
        return (
          <button key={item.id} type="button" onClick={() => onChoose(item.id)} aria-disabled={bloqueada && !podeAbrirBloqueada} aria-label={`Escolher ${item.name}${bloqueada ? ' — Selado pelo Mestre' : ''}`} title={bloqueada ? 'Selado pelo Mestre' : item.description} style={{ ...position, borderColor: item.accent }} className={`absolute z-20 flex size-[105px] -translate-y-1/2 flex-col items-center justify-center rounded-full border bg-[#17100b] px-3 py-2 text-center shadow-lg transition hover:-translate-y-2 hover:bg-[#2a1d12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] max-[639px]:size-[60px] max-[639px]:px-0.5 max-[639px]:leading-[1.05] max-[639px]:text-[7px] sm:size-[125px] ${index === 2 || index === 4 ? 'max-[639px]:!top-[73%]' : index === 6 ? 'max-[639px]:!top-[35%]' : ''}`}>
            {bloqueada && <Lock className="absolute right-2 top-2 h-4 w-4 text-[#d6b56a] max-[639px]:right-1 max-[639px]:top-1 max-[639px]:h-3 max-[639px]:w-3" aria-hidden="true" />}
            <span className="block break-words font-cinzel text-[10px] uppercase leading-tight tracking-wide text-[#eadfc8] max-[639px]:text-[7px]">{item.name}</span><span className="mt-1 block break-words text-[10px] italic leading-tight text-[#9d896b] max-[639px]:text-[7px]">{item.subtitle}</span>{item.id !== 'elementar' && item.branches && <span className="mt-1 block break-words text-[9px] leading-tight text-[#c6a15b] max-[639px]:text-[7px]">Fogo · Água · Ar · Terra</span>}
          </button>
        );
      })}
    </div>
    {onCreate && <div className="flex justify-center border-t border-[#3a2c1d] pt-4"><button type="button" onClick={onCreate} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#b49768] hover:text-[#f0d68b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a] max-[639px]:min-h-11 max-[639px]:px-3"><Plus size={15} /> Inscrever uma magia pessoal</button></div>}
      </section>
      <CirculosExpandidos onChoose={onChoose} bloqueadas={bloqueadas} podeAbrirBloqueada={podeAbrirBloqueada} />
    </>
  );
};
