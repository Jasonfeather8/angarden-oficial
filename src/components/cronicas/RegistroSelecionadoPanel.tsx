import React, { useState } from 'react';
import { CalendarDays, ChevronDown, ChevronUp, Clock3, FileText, MapPin, Users } from 'lucide-react';
import { formatScheduledDate, formatSessionDate } from './formatters';
import type { Cronica, ParticipanteDaCronica } from '@/types';
import { RetratoDePresenca } from '@/components/ui/RetratoDePresenca';
import { useImagensDaCompanhia } from './useImagensDaCompanhia';
import { normalizarBusca } from '@/utils/normalizarBusca';

export interface RegistroSelecionadoPanelProps {
  cronica: Cronica;
  participantes: ParticipanteDaCronica[];
  acoes?: React.ReactNode;
  children?: React.ReactNode;
}

/** Relato da crônica e dados resumidos da sessão. */
export const RegistroSelecionadoPanel: React.FC<RegistroSelecionadoPanelProps> = ({
  cronica,
  participantes,
  acoes,
  children,
}) => {
  const [companhiaExpandida, setCompanhiaExpandida] = useState(true);
  const aprovados = participantes.filter((participante) => participante.status === 'aprovado');
  const nomesLegado = participantes.length ? [] : cronica.personagens;
  const imagensPorNome = useImagensDaCompanhia(cronica.id, nomesLegado);
  // Todos os itens da seção estão presentes na sessão; o retrato carrega o selo.
  const companhia: { nome: string; imagemUrl?: string; confirmado: boolean }[] = participantes.length
    ? aprovados.map((participante) => ({
        nome: participante.nomePersonagem,
        imagemUrl: participante.imagemUrl,
        confirmado: true,
      }))
    : cronica.personagens.map((nome) => ({
        nome,
        imagemUrl: imagensPorNome.get(normalizarBusca(nome)),
        confirmado: true,
      }));
  const estadoDoRegistro =
    cronica.status === 'AGENDADA' && cronica.agendadaPara
      ? `Agendada para ${formatScheduledDate(cronica.agendadaPara)}`
      : cronica.status === 'CONCLUIDA'
        ? `Concluída em ${cronica.concluidaEm ? formatScheduledDate(cronica.concluidaEm) : '—'}`
        : 'Crônica publicada';

  return (
    <section aria-labelledby="chronicle-detail-title" className="min-w-0 border-x border-[#3a2c1d]/60 px-0 sm:px-5">
      {acoes}
      <div className="relative mb-5 border border-[#6b5238] bg-gradient-to-r from-[#21170e] via-[#2b1f14] to-[#17100a] p-4 shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
        <div className="absolute left-1/2 top-0 h-[2px] w-16 -translate-x-1/2 bg-[#d4a359]" />
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[#70552f] bg-[#0d0906] text-[#c6a35e]">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-cinzel text-[10px] uppercase tracking-[0.2em] text-[#9d7c4d]">REGISTRO SELECIONADO</p>
            <h3 id="chronicle-detail-title" className="mt-1 font-cinzel text-lg font-bold leading-tight tracking-wide text-[#f0c265]">{cronica.titulo}</h3>
            <p className="mt-1 flex items-center gap-1 font-serif text-xs italic text-[#a89071]">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> {formatSessionDate(cronica.dataAventura)}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-1/2 h-[2px] w-16 -translate-x-1/2 bg-[#d4a359]" />
      </div>

      <article className="font-garamond text-[16px] leading-relaxed tracking-wide text-[#d6c4ae]">
        <p className="whitespace-pre-wrap first-letter:mr-1 first-letter:font-cinzel first-letter:text-3xl first-letter:font-bold first-letter:text-[#f0c265]">
          {cronica.relato}
        </p>
      </article>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="border border-[#3d2e20] bg-[#120d09]/80 p-3">
          <p className="flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Local da aventura
          </p>
          <p className="mt-1 font-serif text-sm text-[#d0b98d]">{cronica.local || '—'}</p>
        </div>
        <div className="border border-[#3d2e20] bg-[#120d09]/80 p-3">
          <p className="flex items-center gap-1.5 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]">
            <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> Estado do registro
          </p>
          <p className="mt-1 font-serif text-sm text-[#d0b98d]">{estadoDoRegistro}</p>
        </div>
      </div>

      <div className="mt-6 border-t border-[#3a2c1d] pt-4">
        <button
          type="button"
          onClick={() => setCompanhiaExpandida((expandida) => !expandida)}
          aria-expanded={companhiaExpandida}
          className="flex w-full items-center justify-between text-left font-cinzel text-xs font-bold uppercase tracking-[0.16em] text-[#d1a85a] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]"
        >
          <span className="flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" /> Personagens presentes ({companhia.length})</span>
          {companhiaExpandida ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
        </button>
        {companhiaExpandida && (
          <div className="mt-3 flex flex-wrap items-start gap-3">
            {companhia.map((personagem, index) => (
              <RetratoDePresenca
                key={`${personagem.nome}-${index}`}
                nome={personagem.nome}
                imagemUrl={personagem.imagemUrl}
                confirmado={personagem.confirmado}
              />
            ))}
          </div>
        )}
      </div>

      {children && <div className="mt-6 space-y-5 border-t border-[#3a2c1d] pt-5">{children}</div>}
    </section>
  );
};

export default RegistroSelecionadoPanel;
