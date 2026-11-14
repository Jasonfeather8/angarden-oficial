import React from 'react';
import { Skeleton } from '../ui/Skeleton';

/** Esqueleto da galeria em altura cheia (`fill`), no mesmo desenho das 3 colunas. */
export const AcervoCarregando: React.FC = () => (
  <div role="status" aria-live="polite" className="flex h-full min-h-0 select-none flex-col gap-4 font-serif text-[#dcd1ba]">
    <span className="sr-only">Carregando o acervo do seu reino…</span>
    <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
      <div className="flex h-[180px] shrink-0 items-center gap-4 sm:h-[220px] lg:h-full lg:w-[32%]">
        <div className="flex h-full w-6 flex-col justify-around border-r border-[#3a281d]/40 pr-2">
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-3" />
          <Skeleton className="h-3 w-3" />
        </div>
        <div className="flex flex-1 items-center justify-center gap-3">
          <Skeleton className="h-10 w-10 !rounded-full" />
          <Skeleton className="h-12 w-12 !rounded-full" />
          <Skeleton className="h-10 w-10 !rounded-full" />
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center justify-center py-2 lg:flex-1">
        <Skeleton className="h-[200px] w-[200px] !rounded-full sm:h-[260px] sm:w-[260px] lg:h-[320px] lg:w-[320px] xl:h-[390px] xl:w-[390px]" />
      </div>
      <div className="flex min-h-[260px] flex-1 flex-col border border-[#a88242]/40 bg-[#0c0806]/90 p-4 sm:p-6 lg:w-[38%]">
        <Skeleton className="mb-5 h-7 w-3/4" />
        <Skeleton className="mb-3 h-24 w-full" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  </div>
);

export default AcervoCarregando;
