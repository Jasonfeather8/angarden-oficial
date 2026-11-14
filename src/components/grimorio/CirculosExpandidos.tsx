import React, { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import { BrandMark } from '../BrandMark';
import {
  grimorioAdditionalSchools,
  grimorioCosmicoSchools,
  grimorioExotericoSchools,
  grimorioMaiorSchools,
} from '../../mocks/grimorio';

const RevealCircle = ({ children }: { children: React.ReactNode }) => {
  const circleRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = circleRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(element);
      }
    }, { threshold: 0.14 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={circleRef} className={`transition duration-1000 ease-out motion-reduce:transition-none ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-95 opacity-0'}`}>{children}</div>;
};

/** Figura geométrica de fundo que amarra as escolas do círculo. */
type CirculoFigura = 'pentagrama' | 'octagrama' | 'hexagrama';

const pontosDoCaminho = (pontos: { x: number; y: number }[]) => pontos.map((ponto) => `${ponto.x.toFixed(2)},${ponto.y.toFixed(2)}`).join(' ');

/** Traça a figura sobre os vértices onde as escolas se assentam, para que ela una os círculos em vez de flutuar ao fundo. */
const figuraGeometrica = (figura: CirculoFigura, positions: { x: number; y: number }[]): string[] => {
  const anel = pontosDoCaminho(positions);
  const pelosIndices = (indices: number[]) => pontosDoCaminho(indices.map((indice) => positions[indice]));

  if (figura === 'pentagrama' && positions.length === 5) return [anel, pelosIndices([0, 2, 4, 1, 3])];
  if (figura === 'hexagrama' && positions.length === 6) return [anel, pelosIndices([0, 2, 4]), pelosIndices([1, 3, 5])];
  if (figura === 'octagrama' && positions.length === 4) {
    const girado = positions.map((_, indice) => {
      const angulo = -Math.PI / 4 + (indice * Math.PI) / 2;
      return { x: 50 + Math.cos(angulo) * 40, y: 50 + Math.sin(angulo) * 40 };
    });
    return [anel, pontosDoCaminho(girado)];
  }
  return [anel];
};

/** Pontos médios entre escolas: onde a figura cruza o vazio, para os nós do diagrama. */
const pontosMedios = (positions: { x: number; y: number }[]) =>
  positions.map((ponto, indice) => {
    const proximo = positions[(indice + 1) % positions.length];
    return { x: (ponto.x + proximo.x) / 2, y: (ponto.y + proximo.y) / 2 };
  });

interface ExpandedCircleSectionProps {
  id: string;
  title: string;
  description: string;
  schools: typeof grimorioAdditionalSchools;
  circleClassName: string;
  /** Figura geométrica de fundo que amarra as escolas do círculo. */
  figura: CirculoFigura;
  /** Brilho de fundo e borda próprios do círculo. */
  tom: string;
  onChoose: (schoolId: string) => void;
  bloqueadas: string[];
  podeAbrirBloqueada: boolean;
}

const ExpandedCircleSection = ({ id, title, description, schools, circleClassName, figura, tom, onChoose, bloqueadas, podeAbrirBloqueada }: ExpandedCircleSectionProps) => {
  const positions = schools.map((_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / schools.length;
    return { x: 50 + Math.cos(angle) * 40, y: 50 + Math.sin(angle) * 40 };
  });

  return (
    <RevealCircle>
      <section aria-labelledby={`${id}-heading`} className="relative pt-10">
        <div className="pointer-events-none absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-[#8c6b41]/70 to-[#8c6b41]/20" aria-hidden="true" />
      <div className="mb-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Círculo revelado</p>
        <h3 id={`${id}-heading`} className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">{title}</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm italic text-[#9f9077]">{description}</p>
      </div>
      <div className={`relative mx-auto aspect-square w-full ${circleClassName} overflow-hidden rounded-full border ${tom} shadow-[inset_0_0_55px_rgba(0,0,0,0.75)]`} aria-label={`Círculo ${title} com ${schools.length} escolas`}>
        <div className="pointer-events-none absolute inset-[5%] rounded-full border border-[#6b4f2d]/70" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[17%] rounded-full border border-dashed border-[#8c6b41]/35" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-[56%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(216,184,107,0.16),transparent_68%)]" aria-hidden="true" />
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="50" cy="50" r="43.6" fill="none" stroke="#8c6b41" strokeOpacity="0.55" strokeWidth="0.4" strokeDasharray="0.7 22.13" />
          {figuraGeometrica(figura, positions).map((pontos, index) => <polygon key={`${id}-figura-${index}`} points={pontos} fill="none" stroke="#c6a15b" strokeOpacity="0.34" strokeWidth="0.3" />)}
          {positions.map((position, index) => <line key={`${schools[index].id}-connection`} x1="50" y1="50" x2={position.x} y2={position.y} stroke="#9b7748" strokeWidth="0.34" strokeOpacity="0.72" />)}
          {pontosMedios(positions).map((ponto, index) => <circle key={`${id}-no-${index}`} cx={ponto.x} cy={ponto.y} r="0.8" fill="#d8b86b" fillOpacity="0.55" />)}
        </svg>
        <div className="absolute left-1/2 top-1/2 z-10 flex size-[96px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[#c6a15b]/70 bg-[#1a110a] px-2 text-center shadow-[0_0_30px_rgba(216,184,107,0.25)] sm:size-[120px] lg:size-[136px]" aria-hidden="true">
          <BrandMark variant="arvore" altura={32} decorativa className="mb-1" />
          <span className="block max-w-full break-words font-cinzel text-[8px] uppercase leading-[1.05] tracking-[0.15em] text-[#d8b86b] sm:text-[9px] lg:text-[10px]">{title}</span>
        </div>
        {schools.map((school, index) => {
          const bloqueada = bloqueadas.includes(school.id);
          return (
          <button
            key={school.id}
            type="button"
            onClick={() => onChoose(school.id)}
            aria-disabled={bloqueada && !podeAbrirBloqueada}
            aria-label={`Escolher ${school.name}${school.subtitle ? ` (${school.subtitle})` : ''}${bloqueada ? ' — Selado pelo Mestre' : ''}`}
            title={bloqueada ? 'Selado pelo Mestre' : school.description}
            style={{ left: `${positions[index].x}%`, top: `${positions[index].y}%`, borderColor: school.accent }}
            className="absolute z-20 flex size-[68px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 bg-[#17100b] px-2 text-center shadow-[0_0_18px_rgba(0,0,0,0.75)] transition hover:scale-105 hover:bg-[#2a1d12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] focus-visible:outline-offset-2 max-[639px]:size-[58px] max-[639px]:px-0.5 sm:size-[104px] lg:size-[118px]"
          >
            {bloqueada && <Lock className="absolute right-2 top-2 h-4 w-4 text-[#d6b56a] max-[639px]:right-1 max-[639px]:top-1 max-[639px]:h-3 max-[639px]:w-3" aria-hidden="true" />}
            <span className="block max-w-full break-words font-cinzel text-[8px] uppercase leading-[0.95] tracking-wide text-[#eadfc8] max-[639px]:text-[6px] sm:text-[10px] lg:text-[11px]">{school.name}</span>
            <span className="mt-1 block max-w-full break-words text-[7px] italic leading-[0.95] text-[#c6a15b] max-[639px]:text-[6px] sm:text-[9px] lg:text-[10px]">{school.subtitle}</span>
          </button>
          );
        })}
      </div>
      </section>
    </RevealCircle>
  );
};

interface CirculosExpandidosProps {
  onChoose: (schoolId: string, branch?: string) => void;
  bloqueadas: string[];
  podeAbrirBloqueada: boolean;
}

/** Círculos Maior, Exotérico e Cósmico, revelados abaixo do Círculo Menor. */
export const CirculosExpandidos = ({ onChoose, bloqueadas, podeAbrirBloqueada }: CirculosExpandidosProps) => (
  <div className="relative space-y-10 pt-2">
    <div className="pointer-events-none absolute bottom-12 left-1/2 top-12 z-0 w-px -translate-x-1/2 bg-gradient-to-b from-[#8c6b41]/55 via-[#8c6b41]/25 to-[#8c6b41]/55" aria-hidden="true" />
    <ExpandedCircleSection id="circulo-maior" title="Círculo Maior" description="Tradições vastas para aqueles que já atravessaram o primeiro limiar." schools={grimorioMaiorSchools} circleClassName="max-w-[680px] max-[639px]:max-w-[360px]" figura="pentagrama" tom="border-[#4d3822] bg-[radial-gradient(circle_at_center,rgba(216,184,107,0.22),transparent_58%),#0e0a07]" onChoose={onChoose} bloqueadas={bloqueadas} podeAbrirBloqueada={podeAbrirBloqueada} />
    <ExpandedCircleSection id="circulo-exoterico" title="Círculo Exotérico" description="Artes veladas que sondam a mente, os sonhos e os sinais do mundo." schools={grimorioExotericoSchools} circleClassName="max-w-[790px] max-[639px]:max-w-[360px]" figura="octagrama" tom="border-[#43394f] bg-[radial-gradient(circle_at_center,rgba(154,127,157,0.22),transparent_58%),#0e0a07]" onChoose={onChoose} bloqueadas={bloqueadas} podeAbrirBloqueada={podeAbrirBloqueada} />
    <ExpandedCircleSection id="circulo-cosmico" title="Círculo Cósmico" description="Forças primordiais que regem o espaço, a matéria, a luz e o tempo." schools={grimorioCosmicoSchools} circleClassName="max-w-[900px] max-[639px]:max-w-[360px]" figura="hexagrama" tom="border-[#394154] bg-[radial-gradient(circle_at_center,rgba(119,107,148,0.24),transparent_58%),#0e0a07]" onChoose={onChoose} bloqueadas={bloqueadas} podeAbrirBloqueada={podeAbrirBloqueada} />
  </div>
);
