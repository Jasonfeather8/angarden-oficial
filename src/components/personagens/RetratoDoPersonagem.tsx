import React from 'react';
import type { TenantCharacter } from '../../types';

const RETRATO_PADRAO =
  'https://images.unsplash.com/photo-1542382121-6c483f3e6024?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';

export interface RetratoDoPersonagemProps {
  personagemAtivo: TenantCharacter | null;
  onAbrirFicha: (id: string) => void;
  onPrewarm: (id: string) => void;
}

/** Moldura circular central com a arte do personagem ativo. */
export const RetratoDoPersonagem: React.FC<RetratoDoPersonagemProps> = ({
  personagemAtivo,
  onAbrirFicha,
  onPrewarm,
}) => (
  <div className="flex flex-col items-center justify-center relative z-20 py-2 lg:py-0 lg:flex-1 lg:-mx-8 shrink-0">
    <div
      onMouseEnter={() => { if (personagemAtivo?.isKnown) onPrewarm(personagemAtivo.id); }}
      onClick={() => {
        if (personagemAtivo?.isKnown) {
          onAbrirFicha(personagemAtivo.id);
        }
      }}
      className={`relative w-[200px] sm:w-[260px] lg:w-[320px] xl:w-[390px] h-[200px] sm:h-[260px] lg:h-[320px] xl:h-[390px] rounded-full border-2 border-[#a88242]/40 shadow-[inset_0_0_50px_rgba(0,0,0,0.9),0_0_30px_rgba(0,0,0,0.9)] overflow-hidden flex items-center justify-center bg-[#050201] transition-transform duration-300 ${
        personagemAtivo?.isKnown ? 'cursor-pointer hover:scale-[1.02] hover:border-[#f2dfa8]/70 group' : 'cursor-default'
      }`}
      title={personagemAtivo?.isKnown ? `Abrir Ficha de ${personagemAtivo.name}` : ''}
    >
      <div className="absolute inset-0 rounded-full shadow-[inset_0_0_80px_rgba(10,5,0,0.95)] z-10 pointer-events-none"></div>

      {personagemAtivo && personagemAtivo.isKnown ? (
        <div className="w-full h-full relative bg-[#050201]">
          <img
            src={personagemAtivo.largeImage || personagemAtivo.image || RETRATO_PADRAO}
            alt={personagemAtivo.name}
            className="w-full h-full object-cover object-top opacity-90 sepia-[0.15] saturate-125 group-hover:opacity-100 transition-opacity"
            style={{ transform: 'scale(1.05)' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = RETRATO_PADRAO;
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/60 via-transparent to-[#a88242]/20 mix-blend-overlay"></div>
        </div>
      ) : (
        <div className="w-full h-full relative bg-[#050201] flex items-center justify-center">
          <div className="text-[#3a2818] text-[80px] sm:text-[120px] lg:text-[160px] font-cinzel">?</div>
        </div>
      )}
    </div>

    <div className="hidden sm:block absolute w-[220px] sm:w-[280px] lg:w-[350px] xl:w-[420px] h-[220px] sm:h-[280px] lg:h-[350px] xl:h-[420px] rounded-full border border-[#3a2818]/50 pointer-events-none"></div>
    <div className="hidden sm:block absolute w-[240px] sm:w-[300px] lg:w-[380px] xl:w-[450px] h-[240px] sm:h-[300px] lg:h-[380px] xl:h-[450px] rounded-full border border-[#3a2818]/25 pointer-events-none"></div>
  </div>
);

export default RetratoDoPersonagem;
