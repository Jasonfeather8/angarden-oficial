import React from 'react';
import { Search, X } from 'lucide-react';

interface BarraDeBuscaDeMagiasProps {
  busca: string;
  onBuscaChange: (valor: string) => void;
  onLimpar: () => void;
}

/** Busca textual em todos os volumes do Grimório. */
export const BarraDeBuscaDeMagias = ({ busca, onBuscaChange, onLimpar }: BarraDeBuscaDeMagiasProps) => (
  <div className="space-y-2">
    <label htmlFor="grimorio-search" className="block text-[10px] uppercase tracking-[0.22em] text-[#8c6b41]">Buscar magia em todos os volumes</label>
    <div className="flex items-center gap-2 border border-[#5a4225] bg-[#120d09] px-3 focus-within:border-[#c6a15b] focus-within:ring-1 focus-within:ring-[#c6a15b]">
      <Search size={16} className="shrink-0 text-[#8c6b41]" aria-hidden="true" />
      <input
        id="grimorio-search"
        type="search"
        value={busca}
        onChange={(event) => onBuscaChange(event.target.value)}
        placeholder="Nome, efeito, escola…"
        className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#e6ddc5] outline-none placeholder:text-[#74634d] focus-visible:outline-none"
      />
      {busca && <button
        type="button"
        onClick={onLimpar}
        aria-label="Limpar busca de magias"
        className="flex h-8 w-8 shrink-0 items-center justify-center text-[#a88d61] transition hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]"
      ><X size={16} /></button>}
    </div>
  </div>
);
