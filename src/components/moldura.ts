import type { CSSProperties } from 'react';

/** Textura única das molduras (tela, modal e menu). */
export const texturaDaMoldura: CSSProperties = {
  backgroundImage: `url('https://i.postimg.cc/ydLhG37r/Create-matching-texture-background-202608261823.jpg')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
};

/** Casca externa: sombra única, cantos arredondados e espessura da moldura. */
export const molduraExterna = 'relative flex flex-col rounded-xs shadow-[0_0_25px_rgba(0,0,0,0.85)] p-1.5 sm:p-[10px]';

/** Camada interna que escurece a textura e desenha o vão. */
export const molduraInterna = 'border border-[#5a4225] flex-1 min-h-0 relative bg-black/75 flex flex-col p-[2px] text-[#dcd1ba]';

/** Borda dupla interna (laterais e base), na mesma espessura dos cantos. */
export const molduraAcento = 'absolute inset-0 border-[2px] border-transparent border-l-[#3a2c1d] border-r-[#3a2c1d] border-b-[#3a2c1d] pointer-events-none m-[2px]';

/** Canto decorativo; as quatro posições fecham o retângulo. */
export const molduraCanto = 'absolute w-3 h-3 border-[#a88d61] opacity-60 pointer-events-none';
export const posicoesDeCanto = [
  'bottom-0 left-0 border-b-[2px] border-l-[2px]',
  'bottom-0 right-0 border-b-[2px] border-r-[2px]',
  'top-0 right-0 border-t-[2px] border-r-[2px]',
  'top-0 left-0 border-t-[2px] border-l-[2px]',
] as const;
