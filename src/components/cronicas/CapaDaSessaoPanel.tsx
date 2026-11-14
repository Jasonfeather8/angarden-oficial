import React from 'react';
import { Sparkles } from 'lucide-react';
import { ArteDaCronica } from './ArteDaCronica';
import type { Cronica } from '@/types';

export interface CapaDaSessaoPanelProps {
  cronica: Cronica;
}

/** Coluna lateral: capa da sessão e progresso da campanha. */
export const CapaDaSessaoPanel: React.FC<CapaDaSessaoPanelProps> = ({ cronica }) => (
  <aside aria-label="Resumo da crônica" className="min-w-0">
    <div className="mb-3 flex items-center justify-between border-b border-[#3a2c1d] pb-2">
      <p className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">Capa da sessão</p>
      <Sparkles className="h-4 w-4 text-[#8c6b41]" />
    </div>
    <ArteDaCronica title={cronica.titulo} capaUrl={cronica.capaUrl} />
    <div className="mt-4 border border-[#4b3823] bg-[#120d09] p-3">
      <div className="flex items-center justify-between font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]">
        <span>Progresso da campanha</span>
        <span className="text-[#e0bd71]">{cronica.progresso}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden border border-[#3a2c1d] bg-[#0a0705] p-px">
        <div className="h-full bg-gradient-to-r from-[#735126] via-[#b89558] to-[#f0c265]" style={{ width: `${cronica.progresso}%` }} />
      </div>
      <p className="mt-2 font-serif text-xs italic text-[#806b53]">O destino da companhia ainda está sendo escrito.</p>
    </div>
  </aside>
);

export default CapaDaSessaoPanel;
