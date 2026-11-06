import React from 'react';
import { clsx } from 'clsx';
import { ScrollText } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  /** 'cartao' envolve o estado vazio em um cartão; 'plano' é para superfícies que já têm moldura ou borda. */
  variant?: 'cartao' | 'plano';
  className?: string;
}

/**
 * Estado vazio padronizado: evita telas em branco quando uma lista,
 * tabela ou dashboard não possui registros a exibir. Use 'cartao' em superfícies
 * independentes e 'plano' dentro de superfícies que já têm moldura ou borda.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  variant = 'cartao',
  className,
}) => (
  <div
    className={clsx(
      variant === 'cartao'
        ? 'flex flex-col items-center justify-center gap-2 border border-[#5a4225] bg-[#0c0806]/90 px-6 py-12 text-center shadow-[0_0_15px_rgba(0,0,0,0.7)] rounded-xs'
        : 'mx-auto w-full max-w-[560px] px-6 py-10 flex flex-col items-center justify-center gap-2 text-center',
      className
    )}
  >
    <span className="text-[#8c6b41]" aria-hidden="true">
      {icon ?? <ScrollText className="h-8 w-8" />}
    </span>
    <p className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#e6ddc5]">{title}</p>
    {description && <p className="max-w-md font-serif text-xs text-[#a88d61]">{description}</p>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
