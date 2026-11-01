import React from 'react';
import { Shield } from 'lucide-react';

export interface RdPorPeca {
  elmo: number;
  gorjal: number;
  couraca: number;
  bracal: number;
  manoplas: number;
  coxote: number;
  calca: number;
  grevas: number;
}

export function calcularRdPorPeca(rdBase: number, tipoOuCategoria?: string): RdPorPeca {
  const t = (tipoOuCategoria || 'Pesada').toLowerCase().trim();
  const isLeve = t.includes('leve') || t === '4' || t.includes('4');
  const isMedia = !isLeve && (t.includes('méd') || t.includes('med') || t === '6' || t.includes('6'));

  const base = Math.max(0, rdBase || 0);

  if (isLeve) {
    return {
      elmo: 0,
      gorjal: 0,
      couraca: base,
      bracal: 0,
      manoplas: Math.floor(base / 3),
      coxote: 0,
      calca: Math.floor(base / 2),
      grevas: Math.floor(base / 3),
    };
  }

  if (isMedia) {
    return {
      elmo: 0,
      gorjal: 0,
      couraca: base,
      bracal: Math.floor(base / 2),
      manoplas: Math.floor(base / 3),
      coxote: Math.floor(base / 3),
      calca: Math.floor(base / 2),
      grevas: Math.floor(base / 3),
    };
  }

  // Pesada (todas as 8 peças)
  return {
    elmo: Math.floor(base / 4),
    gorjal: Math.floor(base / 2),
    couraca: base,
    bracal: Math.floor(base / 2),
    manoplas: Math.floor(base / 3),
    coxote: Math.floor(base / 3),
    calca: Math.floor(base / 2),
    grevas: Math.floor(base / 3),
  };
}

export interface GradeRdPecasArmaduraProps {
  rdPorPeca: RdPorPeca;
  titulo?: string;
  showTitle?: boolean;
  className?: string;
}

export const GradeRdPecasArmadura: React.FC<GradeRdPecasArmaduraProps> = ({
  rdPorPeca,
  titulo = 'Redução de Dano (RD) por Peça',
  showTitle = false,
  className = '',
}) => {
  const linha1 = [
    { key: 'elmo', label: 'ELMO', val: rdPorPeca.elmo },
    { key: 'gorjal', label: 'GORJAL', val: rdPorPeca.gorjal },
    { key: 'couraca', label: 'COURAÇA (BASE)', val: rdPorPeca.couraca },
    { key: 'bracal', label: 'BRAÇAL', val: rdPorPeca.bracal },
  ];

  const linha2 = [
    { key: 'manoplas', label: 'MANOPLAS', val: rdPorPeca.manoplas },
    { key: 'coxote', label: 'COXOTE', val: rdPorPeca.coxote },
    { key: 'calca', label: 'CALÇA', val: rdPorPeca.calca },
    { key: 'grevas', label: 'GREVAS', val: rdPorPeca.grevas },
  ];

  return (
    <div className={`space-y-2.5 ${className}`}>
      {showTitle && (
        <h4 className="text-xs uppercase tracking-widest text-[#a88d61] font-cinzel font-semibold flex items-center gap-1.5">
          <Shield size={14} className="text-[#c5a059]" />
          {titulo}
        </h4>
      )}

      <div className="space-y-2">
        {/* Linha 1: Elmo, Gorjal, Couraça (Base), Braçal */}
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {linha1.map((item) => (
            <div key={item.key} className="flex flex-col items-center">
              <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-[#a88d61] uppercase block mb-1 font-cinzel text-center tracking-wider truncate w-full">
                {item.label}
              </span>
              <div className="w-full h-9 sm:h-10 rounded bg-[#120e0a] border border-[#3d2a1c] hover:border-[#5a422a] flex items-center justify-center shadow-sm transition-colors">
                <span className={`font-mono font-bold text-sm sm:text-base text-center ${item.val && item.val > 0 ? 'text-[#e6ddc5]' : 'text-[#5a422a]'}`}>
                  {item.val || 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Linha 2: Manoplas, Coxote, Calça, Grevas */}
        <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
          {linha2.map((item) => (
            <div key={item.key} className="flex flex-col items-center">
              <span className="text-[8.5px] sm:text-[9.5px] font-semibold text-[#a88d61] uppercase block mb-1 font-cinzel text-center tracking-wider truncate w-full">
                {item.label}
              </span>
              <div className="w-full h-9 sm:h-10 rounded bg-[#120e0a] border border-[#3d2a1c] hover:border-[#5a422a] flex items-center justify-center shadow-sm transition-colors">
                <span className={`font-mono font-bold text-sm sm:text-base text-center ${item.val && item.val > 0 ? 'text-[#e6ddc5]' : 'text-[#5a422a]'}`}>
                  {item.val || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
