import React from 'react';
import { ItemIconVisual } from './ItemIconVisual';

export interface MolduraDeItemProps {
  type: string;
  imageUrl?: string;
  ladoMiniatura?: number;
  canto?: React.ReactNode;
  sobreposicao?: React.ReactNode;
  className?: string;
}

// Marca d'água rúnica sutil gravada no fundo das ranhuras de item
const RuneWatermark: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-15">
    <path
      d="M 50 20 C 30 20 20 35 20 50 C 20 70 35 80 50 80 C 68 80 78 66 78 50 C 78 36 68 28 54 28 C 42 28 34 36 34 48 C 34 58 42 64 52 64 C 60 64 64 58 64 52 C 64 46 58 44 52 44"
      fill="none"
      stroke="#a39275"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
);

export const MolduraDeItem: React.FC<MolduraDeItemProps> = ({
  type,
  imageUrl,
  ladoMiniatura = 144,
  canto,
  sobreposicao,
  className = 'w-11 h-11 sm:w-12 sm:h-12',
}) => (
  <div
    className={`relative ${className} rounded-xs flex items-center justify-center overflow-hidden shrink-0`}
    style={{
      background: 'linear-gradient(135deg, #3a4550 0%, #20272f 50%, #11151a 100%)',
      border: '1.5px solid #526373',
      boxShadow: '0 3px 8px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.18)',
      padding: '2px',
    }}
  >
    {/* Moldura ornamental interna com filete dourado/latão envelhecido */}
    <div
      className="relative w-full h-full rounded-xs overflow-hidden flex items-center justify-center"
      style={{
        border: '1px solid #8c6b41',
        boxShadow: 'inset 0 0 6px rgba(0,0,0,0.9), 0 0 0 1px #1a140e',
        background: 'radial-gradient(circle at center, #232c35 0%, #0d1115 100%)',
      }}
    >
      {/* Marca d'água rúnica se for ícone SVG padrão */}
      {!imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
          <RuneWatermark />
        </div>
      )}

      {/* Imagem do Item (preenche a moldura com nitidez se tiver fundo) */}
      <ItemIconVisual
        type={type}
        imageUrl={imageUrl}
        className="w-full h-full object-cover z-10"
        ladoMiniatura={ladoMiniatura}
      />

      {/* Vinheta interna suave sobre a imagem para acabamento gótico lapidado */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_5px_rgba(0,0,0,0.7)] z-15" />

      {/* Cantoneiras ornamentais góticas douradas */}
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#f2dfa8]/80 pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#f2dfa8]/80 pointer-events-none z-20" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#f2dfa8]/80 pointer-events-none z-20" />
    </div>

    {canto}
    {sobreposicao}
  </div>
);

export default MolduraDeItem;
