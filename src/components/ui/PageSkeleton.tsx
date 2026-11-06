import React from 'react';
import { PageShell, type PageShellVariant } from '../PageShell';
import { Skeleton } from './Skeleton';

export interface PageSkeletonProps {
  variant?: PageShellVariant;
}

/**
 * Silhueta de página mostrada enquanto o trecho da rota é baixado: a moldura
 * real com o título e as seções em esqueleto, para a tela nascer no formato
 * final em vez de exibir um carregamento genérico com texto.
 */
export const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant = 'padrao' as PageShellVariant }) => (
  <div role="status" aria-live="polite" className="w-full">
    <PageShell
      variant={variant}
      title={<Skeleton className="h-6 w-64 max-w-full" />}
      headerRight={<Skeleton className="h-5 w-24" />}
    >
      <span className="sr-only">Preparando esta página…</span>
      <div aria-hidden="true" className="space-y-6">
        <div className="flex items-center gap-3 border border-[#5a4225] bg-[#140e09] p-4 sm:p-5">
          <Skeleton className="h-14 w-14 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-48 max-w-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="hidden h-10 w-52 sm:block" />
        </div>

        <div className="space-y-3 border border-[#4b3823] bg-[#100b07]/90 p-4 sm:p-5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-64 max-w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="border border-[#4b3823] bg-[#120d09]">
              <Skeleton className="aspect-[16/9] w-full" />
              <div className="space-y-2 p-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  </div>
);

export default PageSkeleton;
