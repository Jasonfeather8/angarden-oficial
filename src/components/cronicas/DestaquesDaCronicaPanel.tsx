import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { ItemIconVisual } from '@/components/ItemIconVisual';
import { MolduraCircular } from '@/components/MolduraCircular';
import { DetalhesDaMercadoriaModal } from '@/components/mercado/DetalhesDaMercadoriaModal';
import { preloadModalDetalhesCompra } from '@/components/mercado/modalDetalhesCompraLazy';
import { ErrorState } from '@/components/ui/ErrorState';
import { useRecompensasDaCronica } from '@/components/cronicas/useRecompensasDaCronica';
import type { MercadoItem } from '@/types';

export interface DestaquesDaCronicaPanelProps {
  cronicaId: string;
}

export const DestaquesDaCronicaPanel: React.FC<DestaquesDaCronicaPanelProps> = ({ cronicaId }) => {
  const { recompensas, isLoading, error, reload } = useRecompensasDaCronica(cronicaId);
  const [selecionado, setSelecionado] = useState<MercadoItem | undefined>();

  if (isLoading) return null;

  const cabecalho = (
    <div className="mb-3 flex items-center justify-between border-b border-[#3a2c1d] pb-2">
      <p className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">Destaques</p>
      <Star className="h-4 w-4 text-[#8c6b41]" aria-hidden="true" />
    </div>
  );

  if (error) {
    return (
      <aside aria-label="Destaques da crônica" className="min-w-0">
        {cabecalho}
        <ErrorState description={error} onRetry={reload} />
      </aside>
    );
  }

  const destaques = recompensas.filter((recompensa) => recompensa.destaque);
  if (destaques.length === 0) return null;

  return (
    <aside aria-label="Destaques da crônica" className="min-w-0">
      {cabecalho}
      <ul className="flex flex-wrap gap-3">
        {destaques.map((recompensa) => {
          const nome = recompensa.itemNome ?? recompensa.itemId ?? 'Mercadoria';
          const conteudo = (
            <>
              <MolduraCircular className={recompensa.tipo === 'item' && recompensa.itemMercado ? 'transition group-hover:scale-[1.03]' : undefined}>
                <ItemIconVisual
                  type={recompensa.itemIconeTipo ?? ''}
                  imageUrl={recompensa.itemImagemUrl}
                  className="h-full w-full object-cover"
                />
              </MolduraCircular>
              <span className="w-full text-center font-cinzel text-[10px] uppercase leading-tight tracking-wider text-[#d6c4ae]">
                {nome}
              </span>
              <span className="font-cinzel text-[10px] text-[#a88d61]">× {recompensa.quantidade}</span>
            </>
          );
          return (
            <li key={recompensa.id}>
              {recompensa.tipo === 'item' && recompensa.itemMercado ? (
                <button
                  type="button"
                  onClick={() => setSelecionado(recompensa.itemMercado)}
                  onMouseEnter={preloadModalDetalhesCompra}
                  aria-label={`Ver detalhes de ${nome}`}
                  className="group flex w-[80px] min-w-0 flex-col items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                >
                  {conteudo}
                </button>
              ) : (
                <figure
                  title={nome}
                  className="flex w-[80px] min-w-0 flex-col items-center gap-1.5"
                >
                  <MolduraCircular>
                    <ItemIconVisual
                      type={recompensa.itemIconeTipo ?? ''}
                      imageUrl={recompensa.itemImagemUrl}
                      className="h-full w-full object-cover"
                    />
                  </MolduraCircular>
                  <figcaption className="w-full text-center font-cinzel text-[10px] uppercase leading-tight tracking-wider text-[#d6c4ae]">
                    {nome}
                  </figcaption>
                  <span className="font-cinzel text-[10px] text-[#a88d61]">× {recompensa.quantidade}</span>
                </figure>
              )}
            </li>
          );
        })}
      </ul>
      {selecionado && (
        <DetalhesDaMercadoriaModal item={selecionado} onClose={() => setSelecionado(undefined)} />
      )}
    </aside>
  );
};

export default DestaquesDaCronicaPanel;
