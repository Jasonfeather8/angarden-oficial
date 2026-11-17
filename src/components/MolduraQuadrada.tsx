import React from 'react';

export interface MolduraQuadradaProps {
  children?: React.ReactNode;
  canto?: React.ReactNode;
  sobreposicao?: React.ReactNode;
  className?: string;
}

export const MolduraQuadrada: React.FC<MolduraQuadradaProps> = ({
  children,
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
    <div
      className="relative w-full h-full rounded-xs overflow-hidden flex items-center justify-center"
      style={{
        border: '1px solid #8c6b41',
        boxShadow: 'inset 0 0 6px rgba(0,0,0,0.9), 0 0 0 1px #1a140e',
        background: 'radial-gradient(circle at center, #232c35 0%, #0d1115 100%)',
      }}
    >
      {children}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_5px_rgba(0,0,0,0.7)] z-15" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#f2dfa8]/80 pointer-events-none z-20" />
      <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#f2dfa8]/80 pointer-events-none z-20" />
      <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#f2dfa8]/80 pointer-events-none z-20" />
    </div>
    {canto}
    {sobreposicao}
  </div>
);

export default MolduraQuadrada;
