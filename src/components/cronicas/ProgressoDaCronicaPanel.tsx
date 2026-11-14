import React, { useState } from 'react';
import { ListChecks } from 'lucide-react';
import type { Cronica, ObjetivoDaCronica } from '@/types';
import { ErrorState } from '../ui/ErrorState';
import { LoadingState } from '../ui/Skeleton';
import { ProgressoDaCronicaModal } from './ProgressoDaCronicaModal';
import { useObjetivosDaCronica } from './useObjetivosDaCronica';

export interface ProgressoDaCronicaPanelProps {
  cronica: Cronica;
  /** Só o Mestre autor marca a conclusão do progresso. */
  podeGerir: boolean;
  /** A crônica mudou (progresso recalculado): a tela recarrega a lista. */
  onCronicaAlterada: () => void;
}

/**
 * Coluna dos progressos da crônica, só para visualização: clicar em um card abre
 * o modal do progresso, onde o Mestre autor marca a conclusão.
 */
export const ProgressoDaCronicaPanel: React.FC<ProgressoDaCronicaPanelProps> = ({
  cronica,
  podeGerir,
  onCronicaAlterada,
}) => {
  const { objetivos, isLoading, error, reload } = useObjetivosDaCronica(cronica.id);
  const [selecionado, setSelecionado] = useState<ObjetivoDaCronica | undefined>(undefined);

  return (
    <>
      <section aria-labelledby="progresso-title" className="min-w-0">
        <div className="mb-3 flex items-end justify-between border-b border-[#3a2c1d] pb-2">
          <p id="progresso-title" className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">
            Progresso
          </p>
          <ListChecks className="h-4 w-4 text-[#8c6b41]" aria-hidden="true" />
        </div>

        {isLoading ? (
          <LoadingState variant="text" label="Carregando progressos…" />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : objetivos.length === 0 ? (
          <p className="font-serif text-sm italic text-[#8f795e]">Nenhum progresso registrado.</p>
        ) : (
          <div className="relative space-y-2 pl-3 before:absolute before:bottom-3 before:left-[7px] before:top-3 before:w-px before:bg-[#5a4225]">
            {objetivos.map((objetivo) => (
              <button
                key={objetivo.id}
                type="button"
                onClick={() => setSelecionado(objetivo)}
                className="group relative w-full border border-[#332519] bg-[#100b08]/80 p-3 text-left transition-all hover:border-[#70552f] hover:bg-[#1a120c] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]"
              >
                <span
                  aria-hidden="true"
                  className="absolute -left-[18px] top-5 h-2.5 w-2.5 rounded-full border-2 border-[#70552f] bg-[#120d09]"
                />
                <div className="absolute right-3 top-3 h-11 w-8 overflow-hidden border border-[#70552f] bg-[#21130b]">
                  {objetivo.imagemUrl ? (
                    <img
                      src={objetivo.imagemUrl}
                      alt={`Imagem do progresso ${objetivo.titulo}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="h-full w-full bg-[radial-gradient(circle_at_65%_25%,#d59b4d_0%,#663317_42%,#160805_100%)]"
                    />
                  )}
                </div>
                <p className="pr-10 font-cinzel text-[11px] font-bold uppercase leading-tight tracking-wide text-[#c2ae87]">
                  {objetivo.titulo}
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex border px-1.5 py-0.5 font-cinzel text-[8px] uppercase tracking-wider ${
                      objetivo.concluido
                        ? 'border-[#8c6b41]/70 bg-[#2a1d10] text-[#e0bd71]'
                        : 'border-[#4b3823] bg-[#120d09] text-[#a88d61]'
                    }`}
                  >
                    {objetivo.concluido ? 'Concluído' : 'Andamento'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <ProgressoDaCronicaModal
        isOpen={Boolean(selecionado)}
        onClose={() => setSelecionado(undefined)}
        objetivo={selecionado}
        cronicaId={cronica.id}
        editavel={false}
        podeGerir={podeGerir}
        onAlterado={() => {
          reload();
          onCronicaAlterada();
        }}
      />
    </>
  );
};

export default ProgressoDaCronicaPanel;
