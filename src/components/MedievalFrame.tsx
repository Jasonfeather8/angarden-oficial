import React from 'react';
import { molduraAcento, molduraCanto, molduraExterna, molduraInterna, posicoesDeCanto, texturaDaMoldura } from './moldura';

export interface MedievalFrameProps {
  id?: string;
  title?: React.ReactNode;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  noHeader?: boolean;
  /** Rola por dentro da moldura (telas densas de altura fixa). Sem isso, quem rola é a <main>. */
  scrollable?: boolean;
}

export const MedievalFrame: React.FC<MedievalFrameProps> = ({
  id,
  title,
  subtitle,
  headerRight,
  children,
  className = '',
  contentClassName = '',
  noHeader = false,
  scrollable = false,
}) => {
  return (
    <div
      id={id}
      className={`${molduraExterna} w-full ${className}`}
      style={texturaDaMoldura}
    >
      {/* Camada interna para escurecer a textura e criar a moldura */}
      <div className={molduraInterna}>

        {/* Bordas duplas internas laterais e inferiores */}
        <div className={molduraAcento}></div>

        {/* Decoração dos cantos */}
        {posicoesDeCanto.map((posicao) => (
          <div key={posicao} className={`${molduraCanto} ${posicao}`} />
        ))}

        {/* Cabeçalho */}
        {!noHeader && (
          <div className="border-b border-[#3a2c1d] pb-2.5 pt-3 px-3.5 sm:px-6 relative flex flex-col md:flex-row md:items-center justify-between gap-3 bg-black/50">
            {/* Decoração superior esquerda (seta apontando para baixo/direita) */}
            <div className="absolute top-0 left-[-2px] w-0 h-0 border-t-[8px] border-t-[#3a2c1d] border-r-[8px] border-r-transparent"></div>
            
            {/* Detalhe vertical esquerdo do cabeçalho */}
            <div className="absolute left-[-2px] top-1/2 w-[3px] h-[70%] bg-[#8c6b41] transform -translate-y-1/2"></div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden min-w-0 flex-1">
              {title && (
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] sm:text-[18px] md:text-[20px] tracking-wider text-[#e6ddc5] uppercase font-bold font-cinzel truncate leading-tight" style={{ textShadow: '1px 1px 3px black' }}>
                    {title}
                  </div>
                  {subtitle && (
                    <div className="text-[9.5px] sm:text-[11px] tracking-wider sm:tracking-widest text-[#a88d61] uppercase italic font-serif mt-0.5 truncate leading-tight">
                      {subtitle}
                    </div>
                  )}
                </div>
              )}
            </div>

            {headerRight && (
              <div className="flex items-center flex-wrap gap-2 z-10 w-full md:w-auto justify-between md:justify-end">
                {headerRight}
              </div>
            )}

            {/* Decoração superior direita (seta apontando para baixo/esquerda) */}
            <div className="absolute top-0 right-[-2px] w-0 h-0 border-t-[8px] border-t-[#3a2c1d] border-l-[8px] border-l-transparent"></div>
          </div>
        )}

        {/* Conteúdo */}
        <div className={`p-2.5 sm:p-4 md:p-6 text-[13px] sm:text-[14px] leading-relaxed relative flex-1 bg-black/25 ${scrollable ? 'min-h-0 overflow-y-auto custom-scrollbar' : ''} ${contentClassName}`}>
          {/* Decoração lateral esquerda sutil */}
          <div className="absolute top-6 left-[-2px] w-[4px] h-[22px] bg-[#3a2c1d] rounded-r-md"></div>
          {children}
        </div>

      </div>
    </div>
  );
};

export default MedievalFrame;
