import React from 'react';
import { clsx } from 'clsx';
import { CalendarDays, Clock3 } from 'lucide-react';
import { formatSessionDate } from './formatters';
import type { Cronica } from '@/types';

export interface LinhaDoTempoPanelProps {
  cronicas: Cronica[];
  /** Id da crônica em leitura; define o item destacado da lista. */
  cronicaSelecionadaId: string;
  onSelecionar: (id: string) => void;
  nomesDeCategoria: Record<string, string>;
}

/** Coluna da linha do tempo: sessões mais recentes primeiro, com a seleção. */
export const LinhaDoTempoPanel: React.FC<LinhaDoTempoPanelProps> = ({
  cronicas,
  cronicaSelecionadaId,
  onSelecionar,
  nomesDeCategoria,
}) => (
  <section aria-labelledby="timeline-title" className="min-w-0">
    <div className="mb-3 flex items-end justify-between border-b border-[#3a2c1d] pb-2">
      <div>
        <p id="timeline-title" className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">
          Linha do tempo
        </p>
        <p className="mt-1 font-serif text-xs italic text-[#80613d]">Sessões mais recentes primeiro</p>
      </div>
      <Clock3 className="h-4 w-4 text-[#8c6b41]" />
    </div>

    <div className="relative space-y-2 pl-3 before:absolute before:bottom-3 before:left-[7px] before:top-3 before:w-px before:bg-[#5a4225]">
      {cronicas.map((cronica) => {
        const selecionada = cronica.id === cronicaSelecionadaId;
        const categoria = cronica.categoriaId ? nomesDeCategoria[cronica.categoriaId] : undefined;
        const selo = cronica.status === 'AGENDADA' ? 'Agendada' : cronica.status === 'CONCLUIDA' ? 'Concluída' : null;

        return (
          <button
            key={cronica.id}
            type="button"
            onClick={() => onSelecionar(cronica.id)}
            aria-current={selecionada ? 'true' : undefined}
            className={clsx(
              'group relative w-full border p-3 text-left transition-all focus:outline-none focus:ring-1 focus:ring-[#d1a85a]',
              selecionada
                ? 'border-[#b89558] bg-gradient-to-r from-[#2b1d10] to-[#17100a] shadow-[0_0_14px_rgba(184,149,88,0.18)]'
                : 'border-[#332519] bg-[#100b08]/80 hover:border-[#70552f] hover:bg-[#1a120c]',
            )}
          >
            <span
              aria-hidden="true"
              className={clsx(
                'absolute -left-[18px] top-5 h-2.5 w-2.5 rounded-full border-2',
                selecionada ? 'border-[#f0c265] bg-[#8c6b41] shadow-[0_0_8px_#d1a85a]' : 'border-[#70552f] bg-[#120d09]',
              )}
            />
            <div className="absolute right-3 top-3 h-11 w-8 overflow-hidden border border-[#70552f] bg-[#21130b]">
              {cronica.capaUrl ? (
                <img src={cronica.capaUrl} alt={`Capa da crônica ${cronica.titulo}`} className="h-full w-full object-cover opacity-80" />
              ) : (
                <div aria-hidden="true" className="h-full w-full bg-[radial-gradient(circle_at_65%_25%,#d59b4d_0%,#663317_42%,#160805_100%)]" />
              )}
            </div>
            <div className="flex items-start justify-between gap-2">
              <p className={clsx('pr-10 font-cinzel text-[11px] font-bold uppercase leading-tight tracking-wide', selecionada ? 'text-[#f0d79b]' : 'text-[#c2ae87]')}>
                {cronica.titulo}
              </p>
              {selo && (
                <span className="shrink-0 border border-[#8c6b41]/70 bg-[#2a1d10] px-1.5 py-0.5 font-cinzel text-[8px] uppercase tracking-wider text-[#e0bd71]">
                  {selo}
                </span>
              )}
            </div>
            {categoria && <p className="mt-1 font-serif text-[11px] text-[#a88d61]">{categoria}</p>}
            <p className="mt-1 flex items-center gap-1 font-serif text-xs italic text-[#806b53]">
              <CalendarDays className="h-3 w-3" />
              {formatSessionDate(cronica.dataAventura)}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1 flex-1 overflow-hidden bg-[#2b1d13]">
                <div className="h-full bg-gradient-to-r from-[#735126] to-[#d1a85a]" style={{ width: `${cronica.progresso}%` }} />
              </div>
              <span className="font-mono text-[10px] text-[#aa8a55]">{cronica.progresso}%</span>
            </div>
          </button>
        );
      })}
    </div>
  </section>
);

export default LinhaDoTempoPanel;
