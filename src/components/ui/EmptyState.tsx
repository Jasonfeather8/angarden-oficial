import React from 'react';
import { clsx } from 'clsx';
import { ScrollText } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Estado vazio padronizado: evita telas em branco quando uma lista,
 * tabela ou dashboard não possui registros a exibir.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className,
}) => (
  <div
    className={clsx(
      'flex flex-col items-center justify-center gap-2 border border-[#5a4225] bg-[#0c0806]/90 px-6 py-12 text-center shadow-[0_0_15px_rgba(0,0,0,0.7)] rounded-xs',
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
