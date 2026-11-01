import React from 'react';

export interface CategoryOrnamentProps {
  active?: boolean;
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  isEpic?: boolean;
  id?: string;
  hotkey?: number | string;
  themeMode?: 'default' | 'epico' | 'arcano';
}

/**
 * CategoryOrnamentTab
 * Implementa a moldura ornamental da imagem de referência com suporte temático:
 * - default: Aço nobre escuro com ornamentos dourados e placa vermelho-vinho
 * - epico: Luxo & exclusividade (Ouro incandescente lapidado, ébano e brasões reluzentes)
 * - arcano: Místico & mágico (Violeta arcano, runas astrais e brilho ciano/ametista)
 */
export const CategoryOrnamentTab: React.FC<CategoryOrnamentProps> = ({
  active = false,
  children,
  label,
  onClick,
  isEpic = false,
  id,
  hotkey,
  themeMode = 'default',
}) => {
  const safeId = (id || label).replace(/[^a-zA-Z0-9_-]/g, '_');
  const isArcane = themeMode === 'arcano';
  const isEpicTheme = themeMode === 'epico' || isEpic;

  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center transition-all duration-300 focus:outline-none select-none p-1 ${
        active 
          ? '-translate-y-2.5 z-30 scale-105' 
          : 'hover:-translate-y-1 hover:brightness-110 opacity-75 hover:opacity-100 z-10'
      }`}
      title={label}
    >
      {/* Container da Moldura Estilizada */}
      <div
        className={`relative w-[84px] h-[88px] sm:w-[94px] sm:h-[98px] transition-all duration-300 flex items-center justify-center ${
          active 
            ? isArcane
              ? 'filter drop-shadow-[0_0_20px_rgba(168,85,247,0.75)] drop-shadow-[0_0_35px_rgba(56,189,248,0.5)]'
              : 'filter drop-shadow-[0_0_20px_rgba(245,158,11,0.75)] drop-shadow-[0_0_32px_rgba(217,119,6,0.45)]' 
            : isArcane
              ? 'filter drop-shadow-[0_0_12px_rgba(147,51,234,0.4)]'
              : isEpicTheme
                ? 'filter drop-shadow-[0_0_14px_rgba(217,119,6,0.5)]'
                : 'filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]'
        }`}
      >
        {/* Halos de luz superior e inferior com brilho incandescente */}
        <div 
          className={`absolute -top-3.5 left-1/2 -translate-x-1/2 w-16 h-4 rounded-full blur-sm pointer-events-none transition-opacity duration-300 ${
            active 
              ? isArcane
                ? 'bg-purple-400/70 opacity-100'
                : 'bg-amber-400/70 opacity-100' 
              : isArcane
                ? 'bg-purple-600/40 opacity-70'
                : isEpicTheme
                  ? 'bg-amber-600/40 opacity-70'
                  : 'bg-[#546473]/15 opacity-20 group-hover:opacity-50'
          }`} 
        />
        <div 
          className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-18 h-5 rounded-full blur-md pointer-events-none transition-opacity duration-300 ${
            active 
              ? isArcane
                ? 'bg-cyan-500/60 opacity-100'
                : 'bg-amber-500/60 opacity-100' 
              : isArcane
                ? 'bg-purple-900/60 opacity-75'
                : isEpicTheme
                  ? 'bg-amber-700/50 opacity-75'
                  : 'bg-black/40 opacity-40 group-hover:opacity-70'
          }`} 
        />

        {/* --- MOLDURA ORNAMENTAL EM SVG FIEL À ESTÉTICA DE AÇO E OURO POLIDO / RUNAS ARCANAS --- */}
        <div className="absolute inset-0 pointer-events-none select-none z-20 overflow-visible">
          <svg
            viewBox="0 0 160 160"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Gradiente do Metal da Moldura */}
              <linearGradient id={`metalGrad_${safeId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                {isArcane ? (
                  active ? (
                    <>
                      <stop offset="0%" stopColor="#f3e8ff" />
                      <stop offset="20%" stopColor="#c084fc" />
                      <stop offset="45%" stopColor="#9333ea" />
                      <stop offset="75%" stopColor="#581c87" />
                      <stop offset="100%" stopColor="#3b0764" />
                    </>
                  ) : (
                    <>
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="25%" stopColor="#6b21a8" />
                      <stop offset="55%" stopColor="#3b0764" />
                      <stop offset="85%" stopColor="#1e1035" />
                      <stop offset="100%" stopColor="#4c1d95" />
                    </>
                  )
                ) : active ? (
                  <>
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="18%" stopColor="#fde68a" />
                    <stop offset="38%" stopColor="#fbbf24" />
                    <stop offset="68%" stopColor="#d97706" />
                    <stop offset="90%" stopColor="#78350f" />
                    <stop offset="100%" stopColor="#b45309" />
                  </>
                ) : isEpicTheme ? (
                  <>
                    <stop offset="0%" stopColor="#fffbeb" />
                    <stop offset="20%" stopColor="#fde68a" />
                    <stop offset="45%" stopColor="#d97706" />
                    <stop offset="75%" stopColor="#92400e" />
                    <stop offset="100%" stopColor="#78350f" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#d4af37" />
                    <stop offset="15%" stopColor="#8c6b41" />
                    <stop offset="35%" stopColor="#414e5b" />
                    <stop offset="65%" stopColor="#1e2630" />
                    <stop offset="85%" stopColor="#141920" />
                    <stop offset="100%" stopColor="#7a5d35" />
                  </>
                )}
              </linearGradient>

              {/* Gradiente de Destaques e Gumes Chanfrados */}
              <linearGradient id={`highlightGlint_${safeId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                {isArcane ? (
                  <>
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                    <stop offset="35%" stopColor="#e9d5ff" stopOpacity="0.85" />
                    <stop offset="70%" stopColor="#38bdf8" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#1e1035" stopOpacity="0.9" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#ffffff" stopOpacity={active ? "0.98" : "0.75"} />
                    <stop offset="35%" stopColor={active ? "#fef08a" : "#f0d28d"} stopOpacity={active ? "0.9" : "0.7"} />
                    <stop offset="70%" stopColor={active ? "#f59e0b" : "#8c6b41"} stopOpacity="0.6" />
                    <stop offset="100%" stopColor={active ? "#92400e" : "#120e0b"} stopOpacity="0.9" />
                  </>
                )}
              </linearGradient>

              {/* Gradiente das Placas Inferiores */}
              <linearGradient id={`bottomPlates_${safeId}`} x1="0%" y1="100%" x2="100%" y2="0%">
                {isArcane ? (
                  <>
                    <stop offset="0%" stopColor="#0a0512" />
                    <stop offset="45%" stopColor="#4c1d95" />
                    <stop offset="85%" stopColor="#7e22ce" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="#07090b" />
                    <stop offset="45%" stopColor={active ? "#b45309" : "#28333e"} />
                    <stop offset="85%" stopColor={active ? "#f59e0b" : "#634e32"} />
                    <stop offset="100%" stopColor={active ? "#fbbf24" : "#c5a059"} />
                  </>
                )}
              </linearGradient>
            </defs>

            {/* 1. MOLDURA EXTERNA PRINCIPAL CHANFRADA */}
            <path
              d="M 32,24 L 128,24 C 138,24 142,28 142,38 L 142,122 C 142,132 138,136 128,136 L 32,136 C 22,136 18,132 18,122 L 18,38 C 18,28 22,24 32,24 Z"
              fill="none"
              stroke={`url(#metalGrad_${safeId})`}
              strokeWidth={active ? "3.2" : "2"}
            />

            {/* 2. CHIFRES SUPERIORES CURVOS (Voltados para dentro com espículas laterais) */}
            {/* Chifre Superior Esquerdo */}
            <g id={`top-left-claw-${safeId}`}>
              {/* Espícula lateral externa */}
              <polygon
                points="18,38 8,28 18,22 24,30"
                fill={`url(#metalGrad_${safeId})`}
                stroke="#06080a"
                strokeWidth="1"
              />
              <polyline
                points="8,28 14,23 24,30"
                fill="none"
                stroke={`url(#highlightGlint_${safeId})`}
                strokeWidth="1.2"
              />
              {/* Garra curva principal apontando para cima e para dentro */}
              <path
                d="M 22,26 C 24,14 36,8 54,12 C 48,16 42,22 36,26 Z"
                fill={`url(#metalGrad_${safeId})`}
                stroke="#06080a"
                strokeWidth="1"
              />
              <path
                d="M 24,24 C 30,12 40,9 54,12"
                fill="none"
                stroke={`url(#highlightGlint_${safeId})`}
                strokeWidth="1.5"
              />
            </g>

            {/* Chifre Superior Direito */}
            <g id={`top-right-claw-${safeId}`}>
              {/* Espícula lateral externa */}
              <polygon
                points="142,38 152,28 142,22 136,30"
                fill={`url(#metalGrad_${safeId})`}
                stroke="#06080a"
                strokeWidth="1"
              />
              <polyline
                points="152,28 146,23 136,30"
                fill="none"
                stroke={`url(#highlightGlint_${safeId})`}
                strokeWidth="1.2"
              />
              {/* Garra curva principal apontando para cima e para dentro */}
              <path
                d="M 138,26 C 136,14 124,8 106,12 C 112,16 118,22 124,26 Z"
                fill={`url(#metalGrad_${safeId})`}
                stroke="#06080a"
                strokeWidth="1"
              />
              <path
                d="M 136,24 C 130,12 120,9 106,12"
                fill="none"
                stroke={`url(#highlightGlint_${safeId})`}
                strokeWidth="1.5"
              />
            </g>

            {/* Arco da borda superior central */}
            <path
              d="M 46,24 Q 80,21 114,24"
              fill="none"
              stroke={`url(#highlightGlint_${safeId})`}
              strokeWidth={active ? "2.2" : "1.2"}
            />

            {/* 3. COLUNAS LATERAIS SEGMENTADAS (Com ranhuras / entalhes retangulares escavados) */}
            {/* Lateral Esquerda */}
            <g id={`col-left-${safeId}`}>
              {/* Entalhe retangular 1 */}
              <rect
                x="14"
                y="46"
                width="7"
                height="22"
                rx="1"
                fill="#07090b"
                stroke={`url(#metalGrad_${safeId})`}
                strokeWidth="1"
              />
              {/* Entalhe retangular 2 */}
              <rect
                x="14"
                y="76"
                width="7"
                height="24"
                rx="1"
                fill="#07090b"
                stroke={`url(#metalGrad_${safeId})`}
                strokeWidth="1"
              />
              {/* Linha externa de acabamento da coluna */}
              <line
                x1="13"
                y1="36"
                x2="13"
                y2="124"
                stroke={`url(#metalGrad_${safeId})`}
                strokeWidth="1.5"
              />
            </g>

            {/* Lateral Direita */}
            <g id={`col-right-${safeId}`}>
              {/* Entalhe retangular 1 */}
              <rect
                x="139"
                y="46"
                width="7"
                height="22"
                rx="1"
                fill="#07090b"
                stroke={`url(#metalGrad_${safeId})`}
                strokeWidth="1"
              />
              {/* Entalhe retangular 2 */}
              <rect
                x="139"
                y="76"
                width="7"
                height="24"
                rx="1"
                fill="#07090b"
                stroke={`url(#metalGrad_${safeId})`}
                strokeWidth="1"
              />
              {/* Linha externa de acabamento da coluna */}
              <line
                x1="147"
                y1="36"
                x2="147"
                y2="124"
                stroke={`url(#metalGrad_${safeId})`}
                strokeWidth="1.5"
              />
            </g>

            {/* 4. BASE INFERIOR ARTICULADA (Guarnição de placas em leque e garras laterais curvas) */}
            <g id={`bottom-guard-${safeId}`}>
              {/* Garra Inferior Esquerda curva */}
              <path
                d="M 22,126 C 16,134 10,146 12,154 C 18,150 26,144 34,136 Z"
                fill={`url(#bottomPlates_${safeId})`}
                stroke="#06080a"
                strokeWidth="1"
              />
              <path
                d="M 20,128 C 14,136 11,146 12,154"
                fill="none"
                stroke={`url(#highlightGlint_${safeId})`}
                strokeWidth="1.2"
              />

              {/* Garra Inferior Direita curva */}
              <path
                d="M 138,126 C 144,134 150,146 148,154 C 142,150 134,144 126,136 Z"
                fill={`url(#bottomPlates_${safeId})`}
                stroke="#06080a"
                strokeWidth="1"
              />
              <path
                d="M 140,128 C 146,136 149,146 148,154"
                fill="none"
                stroke={`url(#highlightGlint_${safeId})`}
                strokeWidth="1.2"
              />

              {/* Escamas/Placas sobrepostas no centro inferior */}
              {/* Placa diagonal esquerda */}
              <polygon
                points="36,136 50,148 64,142 54,132"
                fill={`url(#metalGrad_${safeId})`}
                stroke="#07090b"
                strokeWidth="1"
              />
              <line
                x1="36"
                y1="136"
                x2="50"
                y2="148"
                stroke={`url(#highlightGlint_${safeId})`}
                strokeWidth="1"
              />

              {/* Placa diagonal direita */}
              <polygon
                points="124,136 110,148 96,142 106,132"
                fill={`url(#metalGrad_${safeId})`}
                stroke="#07090b"
                strokeWidth="1"
              />
              <line
                x1="124"
                y1="136"
                x2="110"
                y2="148"
                stroke={`url(#highlightGlint_${safeId})`}
                strokeWidth="1"
              />

              {/* Presa central inferior */}
              <polygon
                points="66,136 80,154 94,136 80,142"
                fill={isArcane ? (active ? "#c084fc" : "#7e22ce") : active ? "#fbbf24" : isEpicTheme ? "#d97706" : "#8c6b41"}
                stroke="#07090b"
                strokeWidth="1"
              />
              <line
                x1="68"
                y1="137"
                x2="80"
                y2="154"
                stroke={`url(#highlightGlint_${safeId})`}
                strokeWidth="1.2"
              />
            </g>
          </svg>
        </div>

        {/* 5. CONTAINER INTERNO COM A ESTÉTICA DA TABELA DE MERCADORIAS (Placa adaptada ao tema) */}
        <div
          className={`absolute inset-[13%] rounded-xl overflow-hidden transition-all duration-300 flex items-center justify-center ${
            isArcane
              ? active
                ? 'border border-[#c084fc] shadow-[inset_0_0_18px_rgba(168,85,247,0.65),0_0_16px_rgba(56,189,248,0.4)]'
                : 'border border-[#581c87]/90 shadow-[inset_0_2px_8px_rgba(0,0,0,0.95)] group-hover:border-[#9333ea]'
              : active
                ? 'border border-[#fbbf24] shadow-[inset_0_0_18px_rgba(245,158,11,0.55),0_0_14px_rgba(245,158,11,0.35)]'
                : isEpicTheme
                  ? 'border border-[#d97706]/90 shadow-[inset_0_0_14px_rgba(180,83,9,0.5)] group-hover:border-[#fbbf24]'
                  : 'border border-[#64231f]/90 shadow-[inset_0_2px_6px_rgba(0,0,0,0.9),inset_0_-2px_6px_rgba(0,0,0,0.9)] group-hover:border-[#99342b]'
          }`}
          style={{
            background: isArcane
              ? active
                ? 'linear-gradient(180deg, #3b0764 0%, #1e1035 50%, #0a0414 100%)'
                : 'linear-gradient(180deg, #24083d 0%, #130621 50%, #08020e 100%)'
              : active
                ? 'linear-gradient(180deg, #481410 0%, #2c0c09 50%, #160504 100%)'
                : isEpicTheme
                  ? 'linear-gradient(180deg, #381b0a 0%, #221005 50%, #100602 100%)'
                  : 'linear-gradient(180deg, #2d0e0b 0%, #1c0806 50%, #0d0302 100%)',
          }}
        >
          {/* Textura sutil em ripas horizontais idêntica à placa da mercadoria */}
          <div 
            className="absolute inset-0 pointer-events-none opacity-40" 
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 1px, transparent 1px, transparent 4px)',
            }}
          />

          {/* Rebites escuros nos cantos superiores e inferiores (detalhe fiel da placa de mercadoria) */}
          <div className={`absolute top-1 left-2.5 w-1 h-1 rounded-full ${isArcane ? 'bg-[#100520] border border-[#7e22ce]' : 'bg-[#0d0302] border border-[#521b17]'} shadow-xs pointer-events-none`} />
          <div className={`absolute top-1 right-2.5 w-1 h-1 rounded-full ${isArcane ? 'bg-[#100520] border border-[#7e22ce]' : 'bg-[#0d0302] border border-[#521b17]'} shadow-xs pointer-events-none`} />
          <div className={`absolute bottom-1 left-2.5 w-1 h-1 rounded-full ${isArcane ? 'bg-[#100520] border border-[#7e22ce]' : 'bg-[#0d0302] border border-[#521b17]'} shadow-xs pointer-events-none`} />
          <div className={`absolute bottom-1 right-2.5 w-1 h-1 rounded-full ${isArcane ? 'bg-[#100520] border border-[#7e22ce]' : 'bg-[#0d0302] border border-[#521b17]'} shadow-xs pointer-events-none`} />

          {/* Feixe luminoso superior com reflexo adaptado */}
          <div 
            className={`absolute top-0 left-0 right-0 h-[1.5px] pointer-events-none ${
              isArcane
                ? active
                  ? 'bg-gradient-to-r from-transparent via-[#c084fc] to-transparent'
                  : 'bg-gradient-to-r from-transparent via-[#9333ea]/60 to-transparent'
                : active 
                  ? 'bg-gradient-to-r from-transparent via-[#fde68a] to-transparent' 
                  : 'bg-gradient-to-r from-transparent via-[#d4af37]/60 to-transparent'
            }`} 
          />

          {/* Fundo com névoa mística / etérea */}
          <div 
            className={`absolute inset-0 pointer-events-none ${
              isArcane
                ? active
                  ? 'bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.3)_0%,transparent_75%)]'
                  : 'bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.18)_0%,transparent_75%)]'
                : active 
                  ? 'bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.25)_0%,transparent_75%)]' 
                  : isEpicTheme
                    ? 'bg-[radial-gradient(circle_at_center,rgba(217,119,6,0.22)_0%,transparent_75%)]'
                    : 'bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.12)_0%,transparent_75%)]'
            }`} 
          />

          {/* Cantoneiras douradas clássicas dos slots de itens */}
          <div className={`absolute top-1 right-1 w-1.5 h-1.5 border-t border-r ${isArcane ? 'border-[#c084fc]/70' : 'border-[#d4af37]/70'} pointer-events-none`} />
          <div className={`absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l ${isArcane ? 'border-[#c084fc]/70' : 'border-[#d4af37]/70'} pointer-events-none`} />

          {/* Ícone Central em Alto Contraste */}
          <div
            className={`relative z-10 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-transform duration-200 ${
              active
                ? isArcane
                  ? 'text-[#ffffff] scale-110 drop-shadow-[0_0_12px_rgba(192,132,252,0.95)]'
                  : 'text-[#ffffff] scale-110 drop-shadow-[0_0_10px_rgba(255,255,255,0.95)]'
                : isArcane
                  ? 'text-[#e9d5ff] group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(168,85,247,0.7)]'
                  : isEpicTheme
                    ? 'text-[#fef3c7] group-hover:text-white group-hover:drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                    : 'text-[#dcd1ba] group-hover:text-[#ffffff] group-hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]'
            }`}
          >
            {children}
          </div>

          {/* Medalhão / Badge de Atalho Numérico (mesmo estilo do medalhão I / Tier da mercadoria) */}
          {hotkey && (
            <div 
              className={`absolute bottom-1 right-1.5 z-20 text-[8px] sm:text-[9px] font-cinzel font-bold px-1 py-0.2 rounded-xs flex items-center justify-center ${
                isArcane ? 'text-[#e9d5ff]' : 'text-[#fde68a]'
              }`}
              style={{
                background: isArcane
                  ? 'linear-gradient(180deg, #3b0764 0%, #150824 100%)'
                  : 'linear-gradient(180deg, #3a4652 0%, #151c22 100%)',
                border: isArcane ? '1px solid #a855f7' : '1px solid #c5a059',
                boxShadow: '0 2px 4px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              {hotkey}
            </div>
          )}
        </div>
      </div>

      {/* Rótulo da Categoria Abaixo da Moldura */}
      <span
        className={`mt-1.5 text-[10px] sm:text-[11px] font-cinzel tracking-wider uppercase font-semibold text-center whitespace-nowrap transition-colors duration-200 ${
          active
            ? isArcane
              ? 'text-[#e879f9] font-bold drop-shadow-[0_0_10px_rgba(232,121,249,0.9)]'
              : 'text-[#fbbf24] font-bold drop-shadow-[0_0_8px_rgba(245,158,11,0.85)]'
            : isArcane
              ? 'text-[#c084fc] group-hover:text-[#f0abfc]'
              : isEpicTheme
                ? 'text-[#f59e0b] group-hover:text-[#fde68a]'
                : 'text-[#8c9ba8] group-hover:text-[#e6ddc5]'
        }`}
      >
        {label}
      </span>
    </button>
  );
};

