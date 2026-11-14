import React from 'react';
import { CalendarDays, Check, Clock3, FileText, MapPin, Users } from 'lucide-react';
import { formatScheduledDate, formatSessionDate } from './formatters';
import type { Cronica, ParticipanteDaCronica } from '@/types';

export interface RegistroSelecionadoPanelProps {
  cronica: Cronica;
  participantes: ParticipanteDaCronica[];
  nomesDeCategoria: Record<string, string>;
}

/** Relato da crônica e dados resumidos da sessão. */
export const RegistroSelecionadoPanel: React.FC<RegistroSelecionadoPanelProps> = ({
  cronica,
  participantes,
  nomesDeCategoria,
}) => {
  const aprovados = participantes.filter((participante) => participante.status === 'aprovado');
  const companhia = participantes.length
    ? aprovados.map((participante) => participante.nomePersonagem)
    : cronica.personagens;

  const nomeDaCategoria = cronica.categoriaId ? nomesDeCategoria[cronica.categoriaId] : undefined;
  const estadoDoRegistro =
    cronica.status === 'AGENDADA' && cronica.agendadaPara
      ? `Agendada para ${formatScheduledDate(cronica.agendadaPara)}`
      : cronica.status === 'CONCLUIDA'
        ? `Concluída em ${cronica.concluidaEm ? formatScheduledDate(cronica.concluidaEm) : '—'}`
        : 'Crônica publicada';

  return (
    <section aria-labelledby="chronicle-title" className="min-w-0">
      <div className="relative mb-5 border border-[#6b5238] bg-gradient-to-r from-[#21170e] via-[#2b1f14] to-[#17100a] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
        <div className="absolute left-1/2 top-0 h-[2px] w-16 -translate-x-1/2 bg-[#d4a359]" />
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#70552f] bg-[#0d0906] text-[#c6a35e]">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-cinzel text-[10px] uppercase tracking-[0.2em] text-[#9d7c4d]">Relato da sessão</p>
            <h2 id="chronicle-title" className="mt-1 font-cinzel text-lg font-bold leading-tight tracking-wide text-[#f0c265]">
              {cronica.titulo}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 border border-[#5a4225] bg-[#1b120b] px-2 py-1 font-serif text-xs italic text-[#a89071]">
                <CalendarDays className="h-3.5 w-3.5" /> {formatSessionDate(cronica.dataAventura)}
              </span>
              <span className="border border-[#5a4225] bg-[#1b120b] px-2 py-1 font-serif text-xs text-[#c6a66d]">
                {nomeDaCategoria ?? 'Sem categoria'}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 h-[2px] w-16 -translate-x-1/2 bg-[#d4a359]" />
      </div>

      <article className="font-garamond text-[16px] leading-relaxed tracking-wide text-[#d6c4ae]">
        <p className="whitespace-pre-wrap first-letter:mr-1 first-letter:font-cinzel first-letter:text-3xl first-letter:font-bold first-letter:text-[#f0c265]">
          {cronica.relato}
        </p>
      </article>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="border border-[#3d2e20] bg-[#120d09]/80 p-3">
          <p className="flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]">
            <MapPin className="h-3.5 w-3.5" /> Local da aventura
          </p>
          <p className="mt-1 font-serif text-sm text-[#d0b98d]">{cronica.local || '—'}</p>
        </div>
        <div className="border border-[#3d2e20] bg-[#120d09]/80 p-3">
          <p className="flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]">
            <Clock3 className="h-3.5 w-3.5" /> Estado do registro
          </p>
          <p className="mt-1 font-serif text-sm text-[#d0b98d]">{estadoDoRegistro}</p>
        </div>
        <div className="border border-[#3d2e20] bg-[#120d09]/80 p-3">
          <p className="flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]">
            <FileText className="h-3.5 w-3.5" /> Categoria
          </p>
          <p className="mt-1 font-serif text-sm text-[#d0b98d]">{nomeDaCategoria ?? 'Sem categoria'}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-[#3a2c1d] pt-4">
        <h3 className="flex items-center gap-2 font-cinzel text-xs font-bold uppercase tracking-[0.16em] text-[#d1a85a]">
          <Users className="h-4 w-4" /> Companhia ({companhia.length})
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {companhia.map((nome, index) => (
            <span
              key={`${nome}-${index}`}
              className="inline-flex items-center gap-1.5 border border-[#5a4225] bg-[#1b120b] px-2.5 py-1 font-serif text-xs text-[#cdb887]"
            >
              <Check className="h-3 w-3 text-[#c6a35e]" />
              {nome}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RegistroSelecionadoPanel;
