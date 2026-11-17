import React from 'react';
import { clsx } from 'clsx';

export interface MolduraCircularProps {
  children?: React.ReactNode;
  /** Conteúdo ancorado no canto inferior direito do círculo (o selo dourado, por exemplo). */
  selo?: React.ReactNode;
  tamanho?: 'sm' | 'md';
  className?: string;
}

const DIAMETROS = { sm: 'size-12', md: 'size-16' } as const;

/**
 * Moldura circular ornamentada: brilho dourado, aro tracejado, aro sólido, dois
 * losangos e o círculo interno escuro. É a mesma moldura dos retratos de presença
 * e das mercadorias em destaque.
 */
export const MolduraCircular: React.FC<MolduraCircularProps> = ({ children, selo, tamanho = 'md', className }) => (
  <span className={clsx('relative flex shrink-0 items-center justify-center', className)}>
    <span aria-hidden="true" className="pointer-events-none absolute -inset-2 rounded-full bg-[radial-gradient(circle,rgba(209,168,90,0.18),transparent_70%)]" />
    <span aria-hidden="true" className="pointer-events-none absolute -inset-[5px] rounded-full border border-dashed border-[#8c6b41]/35" />
    <span aria-hidden="true" className="pointer-events-none absolute -inset-1 rounded-full border border-[#6b4f2d]/80" />
    <span aria-hidden="true" className="pointer-events-none absolute -top-[7px] left-1/2 size-1.5 -translate-x-1/2 rotate-45 border border-[#8c6b41] bg-[#d1a85a]/70" />
    <span aria-hidden="true" className="pointer-events-none absolute -bottom-[7px] left-1/2 size-1.5 -translate-x-1/2 rotate-45 border border-[#8c6b41] bg-[#d1a85a]/70" />
    <span
      className={clsx(
        'relative flex overflow-hidden rounded-full border-2 border-[#a88242]/60 bg-[#0d0906] shadow-[0_0_16px_rgba(0,0,0,0.6),inset_0_0_18px_rgba(0,0,0,0.85)]',
        DIAMETROS[tamanho],
      )}
    >
      {children}
    </span>
    {selo}
  </span>
);

export default MolduraCircular;
