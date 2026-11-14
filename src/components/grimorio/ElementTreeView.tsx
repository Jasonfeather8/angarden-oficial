import React from 'react';
import { Lock } from 'lucide-react';
import { BrandMark } from '../BrandMark';
import { GRIMORIO_ELEMENT_TREE, grimorioElementos } from '../../mocks/grimorio';

interface ElementTreeViewProps {
  onChooseElement: (id: string) => void;
  bloqueadas: string[];
  podeAbrirBloqueada: boolean;
}

/** Rede de caminhos elementais do Grimório. */
export const ElementTreeView = ({ onChooseElement, bloqueadas, podeAbrirBloqueada }: ElementTreeViewProps) => {
  const elementNodes = [
    { id: 'piromancia', x: 14, y: 28, kind: 'base' },
    { id: 'hidromancia', x: 38, y: 28, kind: 'base' },
    { id: 'geomancia', x: 62, y: 30, kind: 'base' },
    { id: 'aeromancia', x: 86, y: 28, kind: 'base' },
    { id: 'eletromancia', x: 14, y: 48, kind: 'branch' },
    { id: 'criromancia', x: 32, y: 46, kind: 'branch' },
    { id: 'magmancia', x: 50, y: 51, kind: 'branch' },
    { id: 'arenomancia', x: 68, y: 47, kind: 'branch' },
    { id: 'metalomancia', x: 86, y: 50, kind: 'branch' },
    { id: 'dinamancia', x: 11, y: 69, kind: 'branch' },
    { id: 'atmomancia', x: 31, y: 65, kind: 'branch' },
    { id: 'fitocinese', x: 50, y: 71, kind: 'branch' },
    { id: 'pneumamancia', x: 69, y: 67, kind: 'branch' },
    { id: 'oximancia', x: 89, y: 70, kind: 'branch' },
    { id: 'plasmamancia', x: 14, y: 89, kind: 'terminal' },
    { id: 'nihilmancia', x: 31, y: 89, kind: 'terminal' },
    { id: 'magnetomancia', x: 86, y: 88, kind: 'terminal' },
    { id: 'eteromancia', x: 62, y: 86, kind: 'terminal' },
  ] as const;
  const connections = [
    ['root', 'piromancia'], ['root', 'hidromancia'], ['root', 'geomancia'], ['root', 'aeromancia'],
    ['piromancia', 'eletromancia'], ['piromancia', 'magmancia'], ['hidromancia', 'eletromancia'], ['hidromancia', 'criromancia'],
    ['geomancia', 'magmancia'], ['geomancia', 'arenomancia'], ['geomancia', 'metalomancia'], ['aeromancia', 'arenomancia'],
    ['aeromancia', 'pneumamancia'], ['eletromancia', 'dinamancia'], ['criromancia', 'atmomancia'], ['magmancia', 'dinamancia'],
    ['arenomancia', 'fitocinese'], ['arenomancia', 'pneumamancia'], ['metalomancia', 'fitocinese'], ['metalomancia', 'magnetomancia'],
    ['dinamancia', 'plasmamancia'], ['atmomancia', 'nihilmancia'], ['fitocinese', 'eteromancia'], ['pneumamancia', 'nihilmancia'],
    ['pneumamancia', 'eteromancia'], ['nihilmancia', 'eteromancia'],
  ] as const;
  const root = { id: 'root', x: 50, y: 9 };
  const getPosition = (id: string) => id === root.id ? root : elementNodes.find((node) => node.id === id)!;

  return (
    <section aria-labelledby="element-tree-heading" className="space-y-6">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Árvore dos elementos</p>
        <h3 id="element-tree-heading" className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">Escolha um caminho elemental</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm italic text-[#9f9077]">Cada círculo guarda os três volumes de um elemento.</p>
      </div>
      <div className="relative mx-auto aspect-[1.55] w-full max-w-5xl overflow-hidden rounded-sm border border-[#4d3822] bg-[radial-gradient(circle_at_center,rgba(176,112,58,0.24),transparent_58%),#0e0a07] shadow-[inset_0_0_45px_rgba(0,0,0,0.7)] max-[639px]:aspect-[0.78]" aria-label={`Rede de caminhos elementais com ${GRIMORIO_ELEMENT_TREE.flat().length} círculos`}>
        <div className="pointer-events-none absolute inset-[3%] rounded-full border border-[#6b4f2d]/30" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[12%] rounded-full border border-dashed border-[#8c6b41]/20" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-[9%] z-0 size-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,184,107,0.2),transparent_70%)]" aria-hidden="true" />
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#8c6b41" strokeOpacity="0.45" strokeWidth="0.35" strokeDasharray="0.7 23.4" />
          {connections.map(([from, to]) => {
            const start = getPosition(from);
            const end = getPosition(to);
            return <line key={`${from}-${to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#9b7748" strokeWidth="0.34" strokeOpacity="0.72" />;
          })}
          {elementNodes.map((node) => <circle key={`junction-${node.id}`} cx={node.x} cy={node.y} r="1.1" fill="#d0a85c" fillOpacity="0.72" />)}
          <circle cx={root.x} cy={root.y} r="3.2" fill="#d8b86b" fillOpacity="0.15" stroke="#c6a15b" strokeOpacity="0.7" strokeWidth="0.35" />
        </svg>
        <div className="absolute left-1/2 top-[9%] z-10 flex size-[5.75rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-[#d8b86b] bg-[#1a110a] px-1 text-center shadow-[0_0_28px_rgba(216,184,107,0.3)] max-[639px]:size-16">
          <BrandMark variant="arvore" altura={22} decorativa className="mb-0.5" />
          <span className="font-cinzel text-[9px] uppercase leading-tight tracking-widest text-[#f1d994] max-[639px]:text-[8px]">Círculo Elementar</span>
        </div>
        {elementNodes.map((node) => {
          const element = grimorioElementos.find((item) => item.id === node.id)!;
          const sizeClass = node.kind === 'base' ? 'size-14 sm:size-[6.7rem]' : 'size-[2.875rem] sm:size-[6.4rem]';
          const bloqueada = bloqueadas.includes(element.id);
          return (
            <button
              key={element.id}
              type="button"
              onClick={() => onChooseElement(element.id)}
              aria-disabled={bloqueada && !podeAbrirBloqueada}
              aria-label={`Escolher ${element.name} (${element.subtitle})${bloqueada ? ' — Selado pelo Mestre' : ''}`}
              title={bloqueada ? 'Selado pelo Mestre' : element.description}
              style={{ borderColor: element.accent, left: `${node.x}%`, top: `${node.y}%` }}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 flex ${sizeClass} flex-col items-center justify-center rounded-full border-2 bg-[#17100b] px-1.5 text-center shadow-[0_0_18px_rgba(0,0,0,0.7)] transition hover:-translate-y-[calc(50%+0.25rem)] hover:bg-[#2a1d12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] focus-visible:outline-offset-2 max-[639px]:px-0.5`}
            >
              {bloqueada && <Lock className="absolute right-1 top-1 h-3 w-3 text-[#d6b56a]" aria-hidden="true" />}
              <span className="block max-w-full break-words font-cinzel text-[8px] uppercase leading-[0.95] tracking-wide text-[#eadfc8] sm:text-[10px]">{element.name}</span>
              <span className="mt-1 block max-w-full break-words text-[8px] italic leading-[0.95] text-[#c6a15b] sm:text-[10px]">({element.subtitle})</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
