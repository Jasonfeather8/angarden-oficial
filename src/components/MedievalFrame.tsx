import React from 'react';

export interface MedievalFrameProps {
  id?: string;
  title?: React.ReactNode;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  noHeader?: boolean;
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
}) => {
  return (
    <div 
      id={id}
      className={`relative w-full shadow-[0_0_25px_rgba(0,0,0,0.85)] p-1.5 sm:p-[10px] ${className}`}
      style={{
        backgroundImage: `url('https://i.postimg.cc/ydLhG37r/Create-matching-texture-background-202608261823.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Camada interna para escurecer a textura e criar a moldura */}
      <div className="border border-[#5a4225] h-full relative bg-black/75 flex flex-col p-[2px] text-[#dcd1ba]">
        
        {/* Bordas duplas internas laterais e inferiores */}
        <div className="absolute inset-0 border-[3px] border-transparent border-l-[#3a2c1d] border-r-[#3a2c1d] border-b-[#3a2c1d] pointer-events-none m-[2px]"></div>

        {/* Cabeçalho */}
        {!noHeader && (
          <div className="border-b border-[#3a2c1d] pb-2.5 pt-3 px-3.5 sm:px-6 relative flex flex-col md:flex-row md:items-center justify-between gap-3 z-10 bg-black/50">
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
        <div className={`p-2.5 sm:p-4 md:p-6 text-[13px] sm:text-[14px] leading-relaxed relative flex-1 z-10 bg-black/25 overflow-y-auto custom-scrollbar ${contentClassName}`}>
          {/* Decoração lateral esquerda sutil */}
          <div className="absolute top-6 left-[-2px] w-[4px] h-[22px] bg-[#3a2c1d] rounded-r-md"></div>
          {children}
        </div>

        {/* Decoração dos cantos */}
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[2px] border-l-[2px] border-[#a88d61] opacity-60 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[2px] border-r-[2px] border-[#a88d61] opacity-60 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t-[2px] border-r-[2px] border-[#a88d61] opacity-60 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-3 h-3 border-t-[2px] border-l-[2px] border-[#a88d61] opacity-60 pointer-events-none"></div>

      </div>
    </div>
  );
};

export default MedievalFrame;
