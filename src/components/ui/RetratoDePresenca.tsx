import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';

export interface RetratoDePresencaProps {
  /** Nome do personagem: vira a legenda e a inicial quando não há imagem. */
  nome: string;
  imagemUrl?: string;
  /** `true` acrescenta o selo dourado de presença confirmada. */
  confirmado?: boolean;
  tamanho?: 'sm' | 'md';
  className?: string;
}

const TAMANHOS = {
  sm: { figura: 'w-[68px]', moldura: 'size-12', inicial: 'text-base', legenda: 'text-[9px]', selo: 'size-4', icone: 'h-2.5 w-2.5' },
  md: { figura: 'w-[80px]', moldura: 'size-16', inicial: 'text-xl', legenda: 'text-[10px]', selo: 'size-5', icone: 'h-3 w-3' },
} as const;

/**
 * Retrato circular das listas de presença: moldura dourada com aros ornamentados,
 * a arte do personagem (ou a inicial do nome) e o selo dourado de presença
 * confirmada. Padroniza a apresentação das presenças em toda a mesa.
 */
export const RetratoDePresenca: React.FC<RetratoDePresencaProps> = ({
  nome,
  imagemUrl,
  confirmado,
  tamanho = 'md',
  className,
}) => {
  const [imagemQuebrada, setImagemQuebrada] = useState<string | null>(null);
  const medida = TAMANHOS[tamanho];
  const inicial = nome.trim().charAt(0).toUpperCase() || '?';
  const mostrarImagem = Boolean(imagemUrl) && imagemQuebrada !== imagemUrl;

  return (
    <figure title={nome} className={clsx('flex min-w-0 flex-col items-center gap-1.5', medida.figura, className)}>
      <span className="relative flex shrink-0 items-center justify-center">
        <span aria-hidden="true" className="pointer-events-none absolute -inset-2 rounded-full bg-[radial-gradient(circle,rgba(209,168,90,0.18),transparent_70%)]" />
        <span aria-hidden="true" className="pointer-events-none absolute -inset-[5px] rounded-full border border-dashed border-[#8c6b41]/35" />
        <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-full border border-[#6b4f2d]/80" />
        <span aria-hidden="true" className="pointer-events-none absolute -top-[7px] left-1/2 size-1.5 -translate-x-1/2 rotate-45 border border-[#8c6b41] bg-[#d1a85a]/70" />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-[7px] left-1/2 size-1.5 -translate-x-1/2 rotate-45 border border-[#8c6b41] bg-[#d1a85a]/70" />
        <span
          className={clsx(
            'relative flex overflow-hidden rounded-full border-2 border-[#a88242]/60 bg-[#0d0906] shadow-[0_0_16px_rgba(0,0,0,0.6),inset_0_0_18px_rgba(0,0,0,0.85)]',
            medida.moldura,
          )}
        >
          {mostrarImagem ? (
            <img
              src={imagemUrl}
              alt={`Retrato de ${nome}`}
              loading="lazy"
              onError={() => setImagemQuebrada(imagemUrl ?? null)}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <span
              aria-hidden="true"
              className={clsx(
                'flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#2a1d12_0%,#100a06_72%)] font-cinzel font-bold text-[#c6a35e]',
                medida.inicial,
              )}
            >
              {inicial}
            </span>
          )}
        </span>
        {confirmado && (
          <span
            aria-hidden="true"
            className={clsx(
              'absolute -bottom-0.5 -right-0.5 z-10 flex items-center justify-center rounded-full border border-[#f0d99b] bg-gradient-to-b from-[#e8c877] to-[#8c6b41] text-[#1b1108] shadow-[0_0_10px_rgba(209,168,90,0.55)]',
              medida.selo,
            )}
          >
            <Check className={clsx('stroke-[3]', medida.icone)} />
          </span>
        )}
      </span>
      <figcaption className={clsx('w-full text-center font-cinzel uppercase leading-tight tracking-wider text-[#d6c4ae]', medida.legenda)}>
        {nome}
      </figcaption>
      {confirmado !== undefined && (
        <span className="sr-only">{confirmado ? 'Presença confirmada' : 'Presença não confirmada'}</span>
      )}
    </figure>
  );
};

export default RetratoDePresenca;
