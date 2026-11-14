import React, { Suspense } from 'react';
import { LoadingState } from '@/components/ui/Skeleton';
import type { ItemBiblioteca } from '@/types';

// Os leitores só baixam quando um material é aberto: o pdf.js é pesado e não
// pode entrar no trecho da rota.
const LeitorPdf = React.lazy(() => import('@/components/biblioteca/LeitorPdf'));
const LeitorPergaminho = React.lazy(() => import('@/components/biblioteca/LeitorPergaminho'));

export interface LeitorDeMaterialProps {
  item: ItemBiblioteca | null;
  onFechar: () => void;
}

/** Leitor em sobreposição: PDF pela pdf.js e os demais tomos como pergaminho. */
export const LeitorDeMaterial: React.FC<LeitorDeMaterialProps> = ({ item, onFechar }) => {
  if (!item) return null;

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0906]/[.98]">
          <LoadingState label="Abrindo o leitor…" />
        </div>
      }
    >
      {item.tipo === 'pdf' ? (
        <LeitorPdf item={item} onFechar={onFechar} />
      ) : (
        <LeitorPergaminho item={item} onFechar={onFechar} />
      )}
    </Suspense>
  );
};

export default LeitorDeMaterial;
