import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface PainelSecaoProps {
  /** Usado como `aria-labelledby` do painel. */
  id?: string;
  icon?: React.ReactNode;
  title: string;
  hint?: string;
  /** Conteúdo à direita do cabeçalho (ações do painel). */
  extra?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

/**
 * Painel de seção do dashboard: cabeçalho com ícone, título em Cinzel e filete,
 * corpo com respiro. É a camada de superfície padrão das telas de painel.
 */
export const PainelSecao: React.FC<PainelSecaoProps> = ({
  id,
  icon,
  title,
  hint,
  extra,
  className,
  contentClassName,
  children,
}) => (
  <section
    aria-labelledby={id}
    className={twMerge('flex min-w-0 flex-col rounded-sm border border-[#3a2c1d] bg-[#160f0a]', className)}
  >
    <header className="flex flex-wrap items-center gap-2.5 border-b border-[#2e2216] bg-[#1b120b] px-4 py-3">
      {icon && (
        <span aria-hidden="true" className="flex shrink-0 items-center justify-center text-[#c6a66d]">{icon}</span>
      )}
      <h2 id={id} className="min-w-0 truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.18em] text-[#d1a85a]">
        {title}
      </h2>
      {hint && <span className="min-w-0 truncate font-serif text-xs text-[#8f795e]">{hint}</span>}
      <span aria-hidden="true" className="h-px flex-1 bg-[#3a2c1d]" />
      {extra}
    </header>
    <div className={twMerge('flex-1 p-4', contentClassName)}>{children}</div>
  </section>
);

export default PainelSecao;
