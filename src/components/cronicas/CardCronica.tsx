import React from 'react';
import { Link } from 'react-router-dom';
import { BarraProgresso } from '@/components/ui/BarraProgresso';
import { cronicaPath } from '@/routes/paths';
import type { Cronica } from '@/types';
import { ArteDaCronica } from './ArteDaCronica';
import { formatSessionDate } from './formatters';

export interface CardCronicaProps {
  cronica: Cronica;
  nomeDaCategoria?: string;
}

/** Card da crônica na estante. */
export const CardCronica: React.FC<CardCronicaProps> = ({ cronica, nomeDaCategoria }) => (
  <Link
    to={cronicaPath(cronica.id)}
    className="block border border-[#3a2c1d] bg-[#160f0a] p-3 transition-colors hover:border-[#70552f] hover:bg-[#1b120b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
  >
    <ArteDaCronica title={cronica.titulo} capaUrl={cronica.capaUrl} />
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="border border-[#5a4225] bg-[#1b120b] px-2 py-1 font-serif text-xs text-[#c6a66d]">
          {nomeDaCategoria ?? 'Sem categoria'}
        </span>
        {cronica.status === 'AGENDADA' && (
          <span className="border border-[#5a4225] bg-[#1b120b] px-2 py-1 font-cinzel text-[9px] uppercase tracking-wider text-[#d1a85a]">
            Agendada
          </span>
        )}
        {cronica.status === 'CONCLUIDA' && (
          <span className="border border-[#5a4225] bg-[#1b120b] px-2 py-1 font-cinzel text-[9px] uppercase tracking-wider text-[#d1a85a]">
            Concluída
          </span>
        )}
      </div>
      <p className="font-serif text-xs italic text-[#806b53]">{formatSessionDate(cronica.dataAventura)}</p>
      <BarraProgresso
        rotulo="Progresso"
        atual={cronica.progresso}
        max={100}
        valorTexto={`${cronica.progresso}%`}
        limiarCritico={0}
      />
    </div>
  </Link>
);

export default CardCronica;
