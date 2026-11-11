import React, { useId } from 'react';

export interface GothicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
  width?: number | string;
  height?: number | string;
  textClassName?: string;
}

/**
 * GothicButton - Botão Gótico Reutilizável com Moldura Vetorial em SVG
 * Adaptado para a paleta Dourada / Âmbar / Obsidian do sistema.
 */
export const GothicButton: React.FC<GothicButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  width,
  height,
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  id,
  textClassName,
  ...rest
}) => {
  const uniqueId = useId().replace(/:/g, '_');
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  // Dimensões padrão baseadas no tamanho com proporções elegantes de UI
  const sizeStyles = {
    xs: {
      defaultWidth: 96,
      defaultHeight: 28,
      fontSize: 'text-[8.5px] sm:text-[9px]',
      tracking: 'tracking-[0.04em]',
      padding: 'px-3.5',
    },
    sm: {
      defaultWidth: 170,
      defaultHeight: 38,
      fontSize: 'text-[9px] sm:text-[9.5px]',
      tracking: 'tracking-[0.03em]',
      padding: 'px-5 sm:px-6',
    },
    md: {
      defaultWidth: 235,
      defaultHeight: 46,
      fontSize: 'text-[10px] sm:text-[11px]',
      tracking: 'tracking-[0.04em]',
      padding: 'px-6 sm:px-7',
    },
    lg: {
      defaultWidth: 320,
      defaultHeight: 70,
      fontSize: 'text-xs sm:text-sm',
      tracking: 'tracking-[0.06em]',
      padding: 'px-8 sm:px-9',
    },
  }[size];

  const finalWidth = width ?? sizeStyles.defaultWidth;
  const finalHeight = height ?? sizeStyles.defaultHeight;

  // IDs exclusivos para gradientes e filtros SVG
  const metalGradId = `metal-grad-${uniqueId}`;
  const bgGradId = `bg-grad-${uniqueId}`;
  const highlightGradId = `highlight-grad-${uniqueId}`;

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center shrink-0 relative group cursor-pointer outline-none focus:outline-none transition-[transform,opacity] duration-200 active:scale-95 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      style={{ width: finalWidth, height: finalHeight, boxShadow: '0 6px 14px rgba(0,0,0,0.85)' }}
      {...rest}
    >
      <svg
        viewBox="0 0 380 100"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradiente de Metal Dourado / Bronze / Titânio */}
          <linearGradient id={metalGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            {isDanger ? (
              <>
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="25%" stopColor="#991b1b" />
                <stop offset="50%" stopColor="#450a0a" />
                <stop offset="75%" stopColor="#7f1d1d" />
                <stop offset="100%" stopColor="#fca5a5" />
              </>
            ) : isPrimary ? (
              <>
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="25%" stopColor="#d97706" />
                <stop offset="50%" stopColor="#78350f" />
                <stop offset="75%" stopColor="#b45309" />
                <stop offset="100%" stopColor="#fde68a" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#8c775a" />
                <stop offset="25%" stopColor="#574533" />
                <stop offset="50%" stopColor="#2c2217" />
                <stop offset="75%" stopColor="#4e3c2c" />
                <stop offset="100%" stopColor="#bba684" />
              </>
            )}
          </linearGradient>

          {/* Gradiente de Fundo do Painel Interno (Obsidian / Âmbar Profundo) */}
          <radialGradient id={bgGradId} cx="50%" cy="80%" r="75%">
            {isDanger ? (
              <>
                <stop offset="0%" stopColor="#5f1313" />
                <stop offset="45%" stopColor="#350a0a" />
                <stop offset="85%" stopColor="#180404" />
                <stop offset="100%" stopColor="#0a0202" />
              </>
            ) : isPrimary ? (
              <>
                <stop offset="0%" stopColor="#4a2c0f" />
                <stop offset="45%" stopColor="#291807" />
                <stop offset="85%" stopColor="#150c04" />
                <stop offset="100%" stopColor="#080402" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#251c14" />
                <stop offset="60%" stopColor="#150f0a" />
                <stop offset="100%" stopColor="#090604" />
              </>
            )}
          </radialGradient>

          {/* Brilho de Realce Dourado */}
          <linearGradient id={highlightGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="30%" stopColor={isDanger ? '#fca5a5' : isPrimary ? '#fde68a' : '#c9b798'} />
            <stop offset="50%" stopColor="#ffffff" />
            <stop offset="70%" stopColor={isDanger ? '#fca5a5' : isPrimary ? '#fde68a' : '#c9b798'} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* 1. Sombra e Borda Externa Gótica com chanfros angulares */}
        <path
          d="M 25 10 
             L 165 10 L 175 4 L 190 14 L 205 4 L 215 10 L 355 10 
             Q 370 10 372 25 
             L 372 40 L 378 50 L 372 60 L 372 75 
             Q 370 90 355 90 
             L 215 90 L 205 96 L 190 86 L 175 96 L 165 90 L 25 90 
             Q 10 90 8 75 
             L 8 60 L 2 50 L 8 40 L 8 25 
             Q 10 10 25 10 Z"
          fill="#060402"
          stroke={`url(#${metalGradId})`}
          strokeWidth="3.5"
        />

        {/* 2. Placa Central do Botão */}
        <rect
          x="14"
          y="14"
          width="352"
          height="72"
          rx="6"
          fill={`url(#${bgGradId})`}
          stroke={isPrimary ? '#543615' : '#2b1f14'}
          strokeWidth="2"
        />

        {/* 3. Linha Interna de Bisel Metálico */}
        <rect
          x="17"
          y="17"
          width="346"
          height="66"
          rx="4"
          fill="none"
          stroke={`url(#${highlightGradId})`}
          strokeWidth="1"
          opacity={isPrimary ? 0.5 : 0.25}
        />

        {/* 4. Ornatos de Canto - Espinhos Metálicos Góticos */}
        <g fill={`url(#${metalGradId})`} stroke="#120c06" strokeWidth="1">
          {/* Canto Superior Esquerdo */}
          <path d="M 6 18 L 22 8 L 26 14 L 14 26 Z" />
          <path d="M 12 4 L 20 12 L 8 20 Z" />

          {/* Canto Superior Direito */}
          <path d="M 374 18 L 358 8 L 354 14 L 366 26 Z" />
          <path d="M 368 4 L 360 12 L 372 20 Z" />

          {/* Canto Inferior Esquerdo */}
          <path d="M 6 82 L 22 92 L 26 86 L 14 74 Z" />
          <path d="M 12 96 L 20 88 L 8 80 Z" />

          {/* Canto Inferior Direito */}
          <path d="M 374 82 L 358 92 L 354 86 L 366 74 Z" />
          <path d="M 368 96 L 360 88 L 372 80 Z" />
        </g>

        {/* 5. Ornamentos Centrais Superiores e Inferiores */}
        <g fill={`url(#${metalGradId})`} stroke="#0d0804" strokeWidth="1">
          {/* Picos Centrais Superiores */}
          <polygon points="172,12 190,0 182,14" />
          <polygon points="208,12 190,0 198,14" />
          <circle cx="190" cy="11" r="2.5" fill={isDanger ? '#fca5a5' : isPrimary ? '#fde68a' : '#c9b798'} />

          {/* Picos Centrais Inferiores */}
          <polygon points="172,88 190,100 182,86" />
          <polygon points="208,88 190,100 198,86" />
          <circle cx="190" cy="89" r="2.5" fill={isDanger ? '#fca5a5' : isPrimary ? '#fde68a' : '#c9b798'} />

          {/* Detalhes Laterais */}
          <polygon points="6,44 0,50 6,56 10,50" />
          <polygon points="374,44 380,50 374,56 370,50" />
        </g>

        {/* 6. Luz de realce sutil no rodapé para efeito dimensional */}
        {isPrimary && (
          <>
            <path d="M 22 80 Q 190 96 358 80 Q 190 62 22 80 Z" fill={`url(#${highlightGradId})`} opacity="0.14" />
            <path d="M 30 78 Q 190 92 350 78 Q 190 65 30 78 Z" fill={`url(#${highlightGradId})`} opacity="0.3" />
          </>
        )}
      </svg>

      {/* Conteúdo de Texto e Ícone Embutido */}
      <div className={`absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-none ${sizeStyles.padding}`}>
        {icon && (
          <span
            className={`flex items-center justify-center shrink-0 ${
              isDanger ? 'text-[#fca5a5]' : isPrimary ? 'text-[#fde68a]' : 'text-[#e6ddc5]'
            } drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]`}
          >
            {icon}
          </span>
        )}
        <span
          className={`font-cinzel font-bold uppercase text-center whitespace-nowrap transition-colors duration-150 ${
            textClassName || `${sizeStyles.fontSize} ${sizeStyles.tracking}`
          } ${
            isDanger
              ? 'text-red-100 group-hover:text-white'
              : isPrimary
              ? 'text-[#fef3c7] group-hover:text-white'
              : 'text-[#dcd1ba] group-hover:text-white'
          }`}
          style={{
            textShadow: isPrimary
              ? '0 0 6px rgba(251, 191, 36, 0.45), 0 1px 2px rgba(0, 0, 0, 0.95), 0 2px 4px rgba(0, 0, 0, 0.9)'
              : '0 1px 3px rgba(0, 0, 0, 0.95)',
          }}
        >
          {children}
        </span>
      </div>
    </button>
  );
};
