import React, { useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  title?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-[550px]', 'max-w-[800px]'
  width?: string;
  showCloseButton?: boolean;
  zIndex?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  onBack,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-[550px]',
  showCloseButton = true,
  zIndex = 'z-50',
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      id="angarden-modal-backdrop"
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200`}
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Container Principal com Bordas e Fundo Texturizado */}
      <div 
        id="angarden-modal-container"
        className={`relative w-full ${maxWidth} shadow-[0_0_30px_rgba(0,0,0,0.95)] p-1.5 sm:p-[10px] my-auto select-none sm:select-auto`}
        onClick={(e) => e.stopPropagation()}
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

          {/* Cabeçalho do Modal */}
          <div className="border-b border-[#3a2c1d] pb-2 pt-2.5 sm:pb-2.5 sm:pt-3.5 px-3 sm:px-5 relative flex items-center justify-between z-10 bg-black/50">
            {/* Decoração superior esquerda (seta apontando para baixo/direita) */}
            <div className="absolute top-0 left-[-2px] w-0 h-0 border-t-[8px] border-t-[#3a2c1d] border-r-[8px] border-r-transparent"></div>
            
            {/* Detalhe vertical esquerdo do cabeçalho */}
            <div className="absolute left-[-2px] top-1/2 w-[3px] h-[70%] bg-[#8c6b41] transform -translate-y-1/2"></div>
            
            <div className="flex items-center flex-1 pr-2 sm:pr-4 min-w-0">
              {onBack && (
                <button
                  id="btn-back-modal"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBack();
                  }}
                  className="mr-2 sm:mr-3 p-1.5 sm:p-1 text-[#a88d61] hover:text-[#fde68a] hover:bg-[#3a2c1d]/60 border border-[#5a4225]/60 hover:border-[#8c6b41] transition-all rounded-xs cursor-pointer flex items-center justify-center shrink-0 touch-manipulation min-h-[32px] min-w-[32px]"
                  title="Voltar"
                >
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="flex-1 min-w-0">
                {title && (
                  <div className="text-sm sm:text-base md:text-[18px] tracking-wider text-[#e6ddc5] uppercase font-bold font-cinzel truncate" style={{ textShadow: '1px 1px 3px black' }}>
                    {title}
                  </div>
                )}
                {subtitle && (
                  <div className="text-[10px] sm:text-[11px] tracking-widest text-[#a88d61] uppercase italic font-serif mt-0.5 truncate">
                    {subtitle}
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Fechar */}
            {showCloseButton && (
              <button
                id="btn-close-modal"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1.5 sm:p-1 text-[#a88d61] hover:text-[#e6ddc5] hover:bg-[#3a2c1d]/60 border border-transparent hover:border-[#5a4225] transition-all rounded-xs shrink-0 cursor-pointer touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center"
                title="Fechar"
              >
                <X size={18} />
              </button>
            )}

            {/* Decoração superior direita (seta apontando para baixo/esquerda) */}
            <div className="absolute top-0 right-[-2px] w-0 h-0 border-t-[8px] border-t-[#3a2c1d] border-l-[8px] border-l-transparent"></div>
          </div>

          {/* Conteúdo Interno com scroll customizado */}
          <div className="px-3 py-3 sm:px-6 sm:py-5 space-y-4 text-[13px] sm:text-[14px] leading-relaxed relative flex-1 z-10 bg-black/25 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto custom-scrollbar font-serif">
            {/* Decoração lateral esquerda sutil */}
            <div className="absolute top-8 left-[-2px] w-[4px] h-[22px] bg-[#3a2c1d] rounded-r-md"></div>
            {children}
          </div>

          {/* Decoração dos cantos (reforçando o aspecto de quadro) */}
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[2px] border-l-[2px] border-[#a88d61] opacity-60"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[2px] border-r-[2px] border-[#a88d61] opacity-60"></div>
          <div className="absolute top-0 right-0 w-3 h-3 border-t-[2px] border-r-[2px] border-[#a88d61] opacity-60"></div>
          <div className="absolute top-0 left-0 w-3 h-3 border-t-[2px] border-l-[2px] border-[#a88d61] opacity-60"></div>

        </div>
      </div>
    </div>
  );
};

export default Modal;
