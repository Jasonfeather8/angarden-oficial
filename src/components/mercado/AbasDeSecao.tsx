import React from 'react';
import { ShoppingBag, Crown, Wand2 } from 'lucide-react';
import type { SecaoMercado } from './catalogoMercado';

interface AbasDeSecaoProps {
  secaoAtiva: SecaoMercado;
  onTrocarSecao: (secao: SecaoMercado) => void;
}

/**
 * Seletores das grandes abas do mercado: Mercado Comum, Arsenal Épico e Mercado Arcano.
 */
export const AbasDeSecao: React.FC<AbasDeSecaoProps> = ({ secaoAtiva, onTrocarSecao }) => (
  <div className="grid grid-cols-3 gap-1 sm:gap-2.5 p-1 sm:p-1.5 bg-[#090705]/95 border border-[#3e2c1a] rounded-xs shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] w-full">
    {/* Aba 1: Mercado Comum */}
    <button
      type="button"
      id="tab-secao-comum"
      onClick={() => {
        onTrocarSecao('comum');
      }}
      className={`relative px-1 sm:px-4 py-2 rounded-xs border transition-colors text-[10px] sm:text-xs font-cinzel tracking-wider uppercase font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer w-full text-center ${
        secaoAtiva === 'comum'
          ? 'bg-gradient-to-b from-[#2a1d12] via-[#1a120b] to-[#100b07] text-[#f2dfa8] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
          : 'bg-[#120d09]/80 text-[#8c6b41] border-[#3e2c1a] hover:text-[#e6ddc5] hover:border-[#6a4f2c]'
      }`}
    >
      <ShoppingBag size={13} className={`shrink-0 ${secaoAtiva === 'comum' ? 'text-[#f2dfa8]' : 'text-[#8c6b41]'}`} />
      <span className="truncate">
        <span className="hidden sm:inline">Mercado </span>Comum
      </span>
      {secaoAtiva === 'comum' && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-0.5 bg-[#c5a059] shadow-[0_0_4px_#c5a059]" />
      )}
    </button>

    {/* Aba 2: Arsenal Épico */}
    <button
      type="button"
      id="tab-secao-epico"
      onClick={() => {
        onTrocarSecao('epico');
      }}
      className={`relative px-1 sm:px-4 py-2 rounded-xs border transition-colors text-[10px] sm:text-xs font-cinzel tracking-wider uppercase font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer w-full text-center ${
        secaoAtiva === 'epico'
          ? 'bg-gradient-to-b from-[#3a2810] via-[#221606] to-[#120b02] text-[#fef08a] border-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.45)]'
          : 'bg-[#120d09]/80 text-[#ca8a04] border-[#5a421a] hover:text-[#fde047] hover:border-[#a16207]'
      }`}
    >
      <Crown size={13} className={`shrink-0 ${secaoAtiva === 'epico' ? 'text-[#facc15]' : 'text-[#a16207]'}`} />
      <span className="truncate">
        <span className="hidden sm:inline">Arsenal </span>Épico
      </span>
      {secaoAtiva === 'epico' && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-0.5 bg-[#eab308] shadow-[0_0_6px_#eab308]" />
      )}
    </button>

    {/* Aba 3: Mercado Arcano */}
    <button
      type="button"
      id="tab-secao-arcano"
      onClick={() => {
        onTrocarSecao('arcano');
      }}
      className={`relative px-1 sm:px-4 py-2 rounded-xs border transition-colors text-[10px] sm:text-xs font-cinzel tracking-wider uppercase font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer w-full text-center ${
        secaoAtiva === 'arcano'
          ? 'bg-gradient-to-b from-[#2e1845] via-[#1a0c2a] to-[#0f0619] text-[#e9d5ff] border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.45)]'
          : 'bg-[#120d09]/80 text-[#a855f7] border-[#4a2468] hover:text-[#f3e8ff] hover:border-[#9333ea]'
      }`}
    >
      <Wand2 size={13} className={`shrink-0 ${secaoAtiva === 'arcano' ? 'text-[#c084fc]' : 'text-[#7e22ce]'}`} />
      <span className="truncate">
        <span className="hidden sm:inline">Mercado </span>Arcano
      </span>
      {secaoAtiva === 'arcano' && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-0.5 bg-[#a855f7] shadow-[0_0_6px_#a855f7]" />
      )}
    </button>
  </div>
);

export default AbasDeSecao;
