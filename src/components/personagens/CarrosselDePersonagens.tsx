import React from 'react';
import type { TenantCharacter } from '../../types';
import { EmptyState } from '../ui/EmptyState';
import type { CarrosselDePersonagensState } from './useCarrosselDePersonagens';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export interface CarrosselDePersonagensProps {
  personagens: TenantCharacter[];
  personagemAtivo: TenantCharacter | null;
  indiceAtivo: number;
  termoBusca: string;
  /** Refs e handlers da roda, vindos de `useCarrosselDePersonagens`. */
  carrossel: CarrosselDePersonagensState;
  onSelecionar: (id: string) => void;
  onAbrirFicha: (id: string) => void;
  onPrewarm: (id: string) => void;
}

/**
 * Coluna esquerda: índice alfabético e a lista em efeito roda (carrossel), com
 * suporte a rodinha do mouse e arraste por toque/mouse.
 */
export const CarrosselDePersonagens: React.FC<CarrosselDePersonagensProps> = ({
  personagens,
  personagemAtivo,
  indiceAtivo,
  termoBusca,
  carrossel,
  onSelecionar,
  onAbrirFicha,
  onPrewarm,
}) => (
  <div className="w-full lg:w-[32%] flex relative z-10 h-[280px] sm:h-[320px] lg:h-full lg:min-h-0 shrink-0">
    {/* Vertical Alphabet Index */}
    <div className="flex flex-col text-[9px] text-[#5a4228] pr-2.5 pt-2 border-r border-[#3a2818]/40 items-center w-6 shrink-0">
      {alphabet.map((letter) => (
        <span
          key={letter}
          className={`leading-tight cursor-default select-none ${personagemAtivo && personagemAtivo.letter === letter ? 'text-[#f2dfa8] font-bold text-xs' : ''}`}
        >
          {letter}
        </span>
      ))}
    </div>

    {/* Lista de Personagens - Efeito Roda (Carrossel) com suporte a Rodinha do Mouse e Arrastar (Touch/Mouse) */}
    <div
      ref={carrossel.listWheelContainerRef}
      className={`flex-1 pl-4 sm:pl-6 relative overflow-hidden pr-2 py-4 select-none overscroll-contain touch-none ${
        carrossel.isDragging ? 'cursor-grabbing' : 'cursor-default'
      }`}
      onPointerDown={carrossel.handlePointerDown}
      onPointerMove={carrossel.handlePointerMove}
      onPointerUp={carrossel.handlePointerUp}
      onPointerCancel={carrossel.handlePointerUp}
    >
      {/* Vertical spine line */}
      <div className="absolute left-[0.9rem] sm:left-[1.1rem] top-0 bottom-0 w-px bg-[#3a2818]/60 z-0 pointer-events-none"></div>

      <div className="relative w-full h-full">
        {personagens.length === 0 ? (
          <EmptyState
            variant="plano"
            title="Nenhum personagem encontrado"
            description={`Não há registros que correspondam a "${termoBusca}".`}
            className="h-full"
          />
        ) : (
          personagens.map((char, index) => {
            const total = personagens.length;
            let relativeIndex = index - indiceAtivo;
            if (total > 1) {
              while (relativeIndex > total / 2) relativeIndex -= total;
              while (relativeIndex < -total / 2) relativeIndex += total;
            }
            const distance = Math.abs(relativeIndex);
            const isFar = distance > 3.5;

            const maxShift = 80;
            const dropoff = 12;
            const calculatedShift = Math.max(0, maxShift - (dropoff * distance * distance));
            const shiftX = maxShift - calculatedShift;

            const shiftY = relativeIndex * 58;
            const isActive = personagemAtivo?.id === char.id;

            return (
              <div
                key={char.id}
                onMouseEnter={() => { if (char.isKnown) onPrewarm(char.id); }}
                onClick={() => {
                  if (!carrossel.hasMovedRef.current && char.isKnown) {
                    if (personagemAtivo?.id === char.id) {
                      onAbrirFicha(char.id);
                    } else {
                      onSelecionar(char.id);
                    }
                  }
                }}
                className={`absolute left-0 right-0 group h-[48px] ${char.isKnown ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
                style={{
                  top: '50%',
                  transform: `translate(${shiftX}px, calc(-50% + ${shiftY}px))`,
                  transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease',
                  zIndex: isActive ? 30 : Math.max(1, Math.round(20 - distance)),
                  opacity: isFar ? 0 : 1,
                  pointerEvents: isFar ? 'none' : 'auto'
                }}
              >
                <div className="relative flex items-center h-full w-full">
                  {/* Dynamic Connective Line back to the spine */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 flex items-center -z-10"
                    style={{
                      right: '100%',
                      width: `${shiftX + 16}px`,
                      transition: 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)'
                    }}
                  >
                    <div className={`w-full h-px ${isActive ? 'bg-[#a88242]' : 'bg-[#3a2818] group-hover:bg-[#5a4228]'} transition-colors duration-300`}></div>
                    <div className={`absolute -left-[3px] w-[6px] h-[6px] rounded-full ${isActive ? 'bg-[#f2dfa8] shadow-[0_0_5px_#f2dfa8]' : 'bg-[#3a2818]'} transition-colors duration-300`}></div>
                  </div>

                  {/* Fundo com a Textura */}
                  <div className={`absolute -inset-y-1 -left-2 right-0 sm:-right-8 lg:-right-[220px] -z-10 transition-all duration-300 overflow-hidden border-t border-b border-l border-r-0 ${isActive ? 'border-[#a88242] shadow-[0_0_15px_rgba(168,130,66,0.25)]' : 'border-[#3a2818]/30 group-hover:border-[#5a4228]/80'}`}>
                    <div
                      className={`absolute inset-0 bg-cover bg-center transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-60'}`}
                      style={{ backgroundImage: `url('https://i.postimg.cc/ydLhG37r/Create-matching-texture-background-202608261823.jpg')` }}
                    ></div>
                    <div className={`absolute inset-0 transition-colors duration-300 ${isActive ? 'bg-[#5a3a1a]/40 mix-blend-multiply' : 'bg-[#0a0604]/80'}`}></div>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#a88242]/40 via-[#a88242]/10 to-transparent"></div>
                    )}
                    {isActive && (
                      <>
                        <div className="absolute top-0 left-0 w-1 h-1 bg-[#f2dfa8]"></div>
                        <div className="absolute bottom-0 left-0 w-1 h-1 bg-[#f2dfa8]"></div>
                      </>
                    )}
                  </div>

                  {/* Setinha apontando no item ativo */}
                  {isActive && (
                    <div className="absolute top-1/2 -left-[14px] -translate-y-1/2 w-2 h-2 bg-[#140a05] border-l border-t border-[#a88242] -rotate-45 z-0"></div>
                  )}

                  {/* Avatar Portrait */}
                  <div className={`relative z-10 w-10 h-10 shrink-0 border ${isActive ? 'border-[#f2dfa8] shadow-[0_0_12px_rgba(242,223,168,0.3)]' : 'border-[#3a2818] group-hover:border-[#5a4228]'} bg-[#1a100a] flex items-center justify-center overflow-hidden transition-all duration-300 rounded-full`}>
                    {char.isKnown && (char.image || char.largeImage) ? (
                      <img
                        src={(char.image || char.largeImage)!}
                        alt={char.name}
                        className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-[#5a4228] text-xl font-bold font-cinzel">?</span>
                    )}
                  </div>

                  {/* Nome */}
                  <div className="ml-3 whitespace-nowrap z-10 overflow-hidden">
                    <span className={`tracking-widest text-xs sm:text-sm font-semibold transition-colors duration-300 font-cinzel truncate block ${isActive ? 'text-[#f2dfa8]' : 'text-[#a88242] group-hover:text-[#d4c4a8]'}`}>
                      {char.name}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
);

export default CarrosselDePersonagens;
