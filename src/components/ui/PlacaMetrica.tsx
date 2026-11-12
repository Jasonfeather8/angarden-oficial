import React from 'react';
import { clsx } from 'clsx';

export interface PlacaMetricaProps {
  icon: React.ReactNode;
  valor: React.ReactNode;
  rotulo: string;
  /** Linha curta opcional abaixo do rótulo. */
  hint?: string;
  className?: string;
}

/** Placa de leitura de um número da mesa: ícone, valor em Cinzel e rótulo. Não é botão. */
export const PlacaMetrica: React.FC<PlacaMetricaProps> = ({ icon, valor, rotulo, hint, className }) => (
  <div className={clsx('flex items-center gap-3 rounded-sm border border-[#3a2c1d] bg-[#160f0a] px-3.5 py-3', className)}>
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xs border border-[#4b3823] bg-[#1d140c] text-[#c6a66d]"
    >
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block font-cinzel text-lg font-bold leading-tight text-[#e6ddc5]">{valor}</span>
      <span className="block truncate font-cinzel text-[9px] uppercase tracking-[0.16em] text-[#a88d61]">{rotulo}</span>
      {hint && <span className="mt-0.5 block truncate font-serif text-[11px] italic text-[#8f795e]">{hint}</span>}
    </span>
  </div>
);

export default PlacaMetrica;
