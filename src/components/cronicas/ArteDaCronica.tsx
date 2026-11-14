import React from 'react';
import { BrandMark } from '../BrandMark';

export interface ArteDaCronicaProps {
  title: string;
  capaUrl?: string;
}

/** Capa da sessão: usa a imagem enviada ou desenha a arte padrão da crônica. */
export const ArteDaCronica: React.FC<ArteDaCronicaProps> = ({ title, capaUrl }) => (
  <div className="relative aspect-[2/3] w-full overflow-hidden border border-[#70552f] bg-[#120b07] shadow-[0_14px_28px_rgba(0,0,0,0.65)]">
    {capaUrl ? (
      <img src={capaUrl} alt={`Capa da crônica ${title}`} className="absolute inset-0 h-full w-full object-cover opacity-75" />
    ) : (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_23%,#f0bb61_0%,#9e5520_25%,#32170d_58%,#090403_100%)]">
        <svg className="h-full w-full" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <path d="M0 355 78 300l84 35 90-60 72 30 76-44v339H0Z" fill="#271207" />
          <path d="M0 410 115 350l108 45 88-55 89 35v285H0Z" fill="#120804" />
          <path d="M-10 478 70 450l80 35 112-51 117 38 41-18v166H-10Z" fill="#050201" />
          <g fill="#080301">
            <path d="M87 321c12-33 56-35 84 2-6 34-16 69-19 105h-15l8-50h-25l-14 50H94l10-61c-16-11-22-25-17-46Z" />
            <path d="M151 314c10-28 27-49 39-36-7 18-15 31-25 45Z" />
            <path d="M126 286c-6-28 5-50 17-48 10 2 10 27 3 48Z" />
            <path d="M266 361c5-28 16-39 24-27 5 24 0 52-6 82h-13l5-30h-9l-8 30h-11Z" />
            <path d="m283 236-16 192" stroke="#080301" strokeWidth="4" />
            <path d="m283 226-6 15h12Z" />
          </g>
          <g fill="#d8a04b" opacity=".4">
            <circle cx="300" cy="122" r="2" />
            <circle cx="327" cy="96" r="1.5" />
            <circle cx="250" cy="154" r="1.5" />
          </g>
        </svg>
      </div>
    )}
    <div className="absolute inset-0 bg-gradient-to-t from-[#080302] via-transparent to-[#1b0d05]/20" />
    <div className="absolute inset-3 border border-[#d1a85a]/45" />
    <div className="absolute inset-x-6 top-6 flex justify-center">
      <BrandMark variant="completa" altura={14} larguraMaxima={120} decorativa />
    </div>
    <div className="absolute inset-x-6 bottom-7 text-center">
      <p className="font-cinzel text-base font-bold uppercase leading-tight tracking-wider text-[#f0e2c0] drop-shadow-[1px_1px_2px_#000]">
        {title}
      </p>
      <div className="mx-auto mt-3 h-px w-20 bg-[#d1a85a]/70" />
    </div>
  </div>
);

export default ArteDaCronica;
