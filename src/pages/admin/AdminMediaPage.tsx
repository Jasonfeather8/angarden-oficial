import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Archive, BookOpen, HardDrive, Image, Package, UserRound, WandSparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { GothicButton } from '@/components/GothicButton';
import { MedievalFrame } from '@/components/MedievalFrame';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { useAsyncData, invalidateAsyncDataCache } from '@/hooks/useAsyncData';
import { inventariarMidiaLegada, migrarMidiaLegada, type RelatorioMigracao } from '@/services/mediaService';

const formatarMegabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MB`;

export const AdminMediaPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, error, reload } = useAsyncData(inventariarMidiaLegada, []);
  const [processando, setProcessando] = useState(false);
  const [progresso, setProgresso] = useState({ concluidos: 0, total: 0 });
  const [relatorio, setRelatorio] = useState<RelatorioMigracao | null>(null);
  const [erroMigracao, setErroMigracao] = useState<string | null>(null);

  const iniciarMigracao = async () => {
    setProcessando(true);
    setRelatorio(null);
    setErroMigracao(null);
    setProgresso({ concluidos: 0, total: 0 });
    try {
      const resultado = await migrarMidiaLegada((concluidos, total) => setProgresso({ concluidos, total }));
      setRelatorio(resultado);
      invalidateAsyncDataCache();
      await queryClient.invalidateQueries({ queryKey: ['mercado'] });
      reload();
    } catch (cause) {
      setErroMigracao(cause instanceof Error ? cause.message : 'Não foi possível concluir a migração.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <MedievalFrame
      title="Mídia & Armazenamento"
      subtitle="Manutenção administrativa da biblioteca de imagens"
      contentClassName="space-y-5"
    >
      <p className="font-serif text-sm text-[#c4b9a3]">
        Esta é uma ação única de manutenção que move as imagens gravadas no banco para o armazenamento, sem alterar as imagens exibidas no app.
      </p>

      {isLoading ? (
        <LoadingState variant="cards" label="Inventariando imagens armazenadas…" />
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : (
        <>
          {data && data.totalBytes === 0 ? (
            <EmptyState
              icon={<Archive className="h-8 w-8" aria-hidden="true" />}
              title="Nenhuma imagem embutida encontrada"
              description="Todas as imagens identificadas já estão no armazenamento ou não há imagens legadas para migrar."
            />
          ) : (
            <section aria-label="Inventário de imagens legadas" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <article className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
                <div className="flex items-center gap-2 text-[#a88d61]"><Image className="h-4 w-4" aria-hidden="true" /><h2 className="font-cinzel text-xs uppercase tracking-wider">Fichas</h2></div>
                <p className="mt-2 font-cinzel text-2xl text-[#e6ddc5]">{data?.fichas ?? 0}</p>
                <p className="font-serif text-xs text-[#8c6b41]">com imagem embutida</p>
              </article>
              <article className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
                <div className="flex items-center gap-2 text-[#a88d61]"><UserRound className="h-4 w-4" aria-hidden="true" /><h2 className="font-cinzel text-xs uppercase tracking-wider">Personagens</h2></div>
                <p className="mt-2 font-cinzel text-2xl text-[#e6ddc5]">{data?.personagens ?? 0}</p>
                <p className="font-serif text-xs text-[#8c6b41]">com imagem embutida</p>
              </article>
              <article className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
                <div className="flex items-center gap-2 text-[#a88d61]"><Package className="h-4 w-4" aria-hidden="true" /><h2 className="font-cinzel text-xs uppercase tracking-wider">Mercadorias</h2></div>
                <p className="mt-2 font-cinzel text-2xl text-[#e6ddc5]">{data?.mercado ?? 0}</p>
                <p className="font-serif text-xs text-[#8c6b41]">com imagem embutida</p>
              </article>
              <article className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
                <div className="flex items-center gap-2 text-[#a88d61]"><BookOpen className="h-4 w-4" aria-hidden="true" /><h2 className="font-cinzel text-xs uppercase tracking-wider">Grimório</h2></div>
                <p className="mt-2 font-cinzel text-2xl text-[#e6ddc5]">{data?.grimorio ?? 0}</p>
                <p className="font-serif text-xs text-[#8c6b41]">com imagem embutida</p>
              </article>
              <article className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
                <div className="flex items-center gap-2 text-[#a88d61]"><HardDrive className="h-4 w-4" aria-hidden="true" /><h2 className="font-cinzel text-xs uppercase tracking-wider">Espaço no banco</h2></div>
                <p className="mt-2 font-cinzel text-2xl text-[#e6ddc5]">{formatarMegabytes(data?.totalBytes ?? 0)}</p>
                <p className="font-serif text-xs text-[#8c6b41]">em strings de imagem</p>
              </article>
            </section>
          )}

          <div className="flex flex-col items-start gap-3">
            <GothicButton
              onClick={iniciarMigracao}
              disabled={processando || !data || data.totalBytes === 0}
              icon={<WandSparkles className="h-4 w-4" aria-hidden="true" />}
              className="max-w-full"
            >
              Migrar imagens para o armazenamento
            </GothicButton>
            {processando && (
              <div className="w-full max-w-xl space-y-2" role="status" aria-live="polite">
                <p className="font-cinzel text-xs uppercase tracking-wider text-[#d4af37]">
                  Convertendo {progresso.concluidos} de {progresso.total}
                </p>
                <div className="h-2 overflow-hidden border border-[#5a4225] bg-[#120f0d]">
                  <div
                    className={clsx('h-full bg-[#8c6b41] transition-[width] duration-200')}
                    style={{ width: `${progresso.total ? (progresso.concluidos / progresso.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {erroMigracao && <ErrorState title="Falha na migração" description={erroMigracao} />}

          {relatorio && (
            <section className="space-y-3 border border-[#5a4225] bg-[#0c0806]/80 p-4" aria-labelledby="relatorio-migracao">
              <h2 id="relatorio-migracao" className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#e6ddc5]">Relatório da migração</h2>
              <ul className="grid gap-2 font-serif text-sm text-[#c4b9a3] sm:grid-cols-3">
                <li>{relatorio.convertidas} imagem(ns) convertida(s)</li>
                <li>{relatorio.ignoradas} imagem(ns) ignorada(s)</li>
                <li>{formatarMegabytes(relatorio.bytesLiberados)} liberados</li>
              </ul>
              {relatorio.falhas.length > 0 && (
                <div className="border-t border-[#3a2c1d] pt-3">
                  <h3 className="font-cinzel text-xs font-bold uppercase tracking-wider text-[#f0b09b]">Falhas</h3>
                  <ul className="mt-2 list-inside list-disc space-y-1 font-serif text-xs text-[#e7b29e]">
                    {relatorio.falhas.map((falha, index) => <li key={`${index}-${falha}`}>{falha}</li>)}
                  </ul>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </MedievalFrame>
  );
};

export default AdminMediaPage;
