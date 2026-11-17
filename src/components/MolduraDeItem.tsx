import React from 'react';
import { ItemIconVisual } from './ItemIconVisual';
import { MolduraQuadrada } from './MolduraQuadrada';

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
  <MolduraQuadrada className={className} canto={canto} sobreposicao={sobreposicao}>
    {!imageUrl && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
        <RuneWatermark />
      </div>
    )}
    <ItemIconVisual
      type={type}
      imageUrl={imageUrl}
      className="w-full h-full object-cover z-10"
      ladoMiniatura={ladoMiniatura}
    />
  </MolduraQuadrada>
);

export default MolduraDeItem;
