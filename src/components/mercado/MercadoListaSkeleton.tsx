import React from 'react';
import { Skeleton } from '../ui/Skeleton';

/** Esqueleto de carregamento da listagem de itens do catálogo. */
export const MercadoListaSkeleton: React.FC = () => (
  <div
    aria-hidden="true"
    className="space-y-2 bg-[#0c0806]/85 p-1.5 sm:p-3 rounded-xs border border-[#5a4225] shadow-[0_0_20px_rgba(0,0,0,0.8)]"
  >
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="relative rounded-xs p-1.5 flex items-center gap-2"
        style={{
          background: 'linear-gradient(180deg, #323b44 0%, #222930 15%, #151a1e 50%, #0d1013 85%, #07090b 100%)',
          borderTop: '1px solid #546473',
          borderBottom: '1.5px solid #050709',
          borderLeft: '1px solid #283038',
          borderRight: '1px solid #283038',
          boxShadow: '0 4px 10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
        }}
      >
        <Skeleton className="h-11 w-11 shrink-0 sm:h-12 sm:w-12" />
        <div className="min-w-0 flex-1 space-y-2 px-1 sm:px-2">
          <Skeleton className={`h-3 ${index % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
          <Skeleton className={`h-3 ${index % 3 === 0 ? 'w-1/3' : 'w-1/2'}`} />
        </div>
        <Skeleton className="hidden h-3 w-16 sm:block" />
        <Skeleton className="h-7 w-20 shrink-0" />
      </div>
    ))}
  </div>
);

export default MercadoListaSkeleton;
