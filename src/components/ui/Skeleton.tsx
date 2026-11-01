import React from 'react';
import { clsx } from 'clsx';

export interface SkeletonProps {
  className?: string;
}

/** Bloco base de esqueleto de carregamento, na paleta medieval. */
export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div
    aria-hidden="true"
    className={clsx('animate-pulse rounded-xs border border-[#3a2c1d] bg-[#241a11]/80', className)}
  />
);

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className }) => (
  <div className={clsx('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        className={clsx('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')}
      />
    ))}
  </div>
);

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, columns = 4, className }) => (
  <div className={clsx('space-y-2', className)}>
    <Skeleton className="h-8 w-full bg-[#2a1d10]/90" />
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((__, columnIndex) => (
          <Skeleton key={columnIndex} className="h-9" />
        ))}
      </div>
    ))}
  </div>
);

export interface SkeletonCardsProps {
  count?: number;
  className?: string;
}

export const SkeletonCards: React.FC<SkeletonCardsProps> = ({ count = 6, className }) => (
  <div className={clsx('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
    {Array.from({ length: count }).map((_, index) => (
      <Skeleton key={index} className="h-28" />
    ))}
  </div>
);

export interface LoadingStateProps {
  label?: string;
  variant?: 'table' | 'cards' | 'text';
  className?: string;
}

/**
 * Estado de carregamento acessível: anuncia o progresso para leitores de tela
 * e exibe um esqueleto visual coerente com o tipo de conteúdo esperado.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Carregando…', variant = 'text', className }) => (
  <div role="status" aria-live="polite" className={clsx('space-y-3', className)}>
    <span className="sr-only">{label}</span>
    {variant === 'table' && <SkeletonTable />}
    {variant === 'cards' && <SkeletonCards />}
    {variant === 'text' && <SkeletonText lines={4} />}
    <p className="text-center font-serif text-xs text-[#8c6b41]">{label}</p>
  </div>
);

export default Skeleton;
