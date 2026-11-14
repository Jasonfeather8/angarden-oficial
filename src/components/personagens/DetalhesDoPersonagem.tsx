import React from 'react';
import type { TenantCharacter } from '../../types';

export interface DetalhesDoPersonagemProps {
  personagemAtivo: TenantCharacter | null;
}

/** Painel direito: citação, narrativa e o aviso de conteúdo bloqueado pelo Mestre. */
export const DetalhesDoPersonagem: React.FC<DetalhesDoPersonagemProps> = ({ personagemAtivo }) => (
  <div className="w-full lg:w-[38%] z-20 flex flex-col min-h-[260px] lg:min-h-0 flex-1">
    <div className="border border-[#a88242]/40 bg-[#0c0806]/90 p-4 sm:p-6 flex-1 flex flex-col relative h-full rounded-xs shadow-[0_0_20px_rgba(0,0,0,0.7)]">
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#a88242]/70"></div>
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#a88242]/70"></div>
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#a88242]/70"></div>
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#a88242]/70"></div>

      {personagemAtivo && personagemAtivo.isKnown ? (
        <>
          <div className="pb-2 border-b border-[#3a2818] mb-3 sm:mb-4">
            <h2 className="text-[#f2dfa8] text-lg sm:text-2xl tracking-wider uppercase font-semibold font-cinzel truncate" style={{ textShadow: '1px 1px 2px black' }}>
              {personagemAtivo.name}
            </h2>
          </div>

          <div className="overflow-y-auto custom-scrollbar pr-2 sm:pr-3 flex-1 space-y-3 sm:space-y-4">
            {personagemAtivo.quote && (
              <div className="relative pt-2 pl-4 pr-2 border-l-2 border-[#5a4225] bg-black/40 p-2.5 sm:p-3 rounded-r-xs mb-3 sm:mb-4">
                <span className="absolute -left-2 top-0 text-[#a88d61] text-2xl sm:text-3xl font-serif leading-none opacity-80" style={{ textShadow: '1px 1px 2px black' }}>
                  &ldquo;
                </span>
                <p className="text-[#e0d6c1] ml-2 text-justify italic font-serif text-xs sm:text-sm leading-relaxed">
                  {personagemAtivo.quote}
                </p>
                <p className="text-right text-[#a88d61] text-[11px] sm:text-xs mt-1.5 font-serif">&mdash; {personagemAtivo.quoteSource}</p>
              </div>
            )}

            <div className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm text-[#c0b096] leading-relaxed font-serif text-justify">
              {personagemAtivo.description?.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </>
      ) : personagemAtivo ? (
        <div className="flex-1 flex flex-col items-center justify-center text-[#5a4228] italic font-serif p-4 text-center">
          <p>Informações do personagem desconhecidas ou bloqueadas pelo Mestre.</p>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#5a4228] italic font-serif">
          Nenhum personagem selecionado.
        </div>
      )}
    </div>
  </div>
);

export default DetalhesDoPersonagem;
