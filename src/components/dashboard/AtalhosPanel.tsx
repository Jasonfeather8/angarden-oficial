import React, { useMemo } from 'react';
import { BookOpen, ChevronRight, Crown, ScrollText, Store, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../routes/paths';
import { PainelSecao } from '../ui/PainelSecao';

interface Atalho {
  id: string;
  label: string;
  hint: string;
  icon: React.ReactNode;
  to: string;
}

export interface AtalhosPanelProps {
  isMestre: boolean;
}

/** Atalhos de navegação da casca. O atalho do Painel do Mestre é exclusivo do papel `mestre`. */
export const AtalhosPanel: React.FC<AtalhosPanelProps> = ({ isMestre }) => {
  const atalhos = useMemo<Atalho[]>(() => {
    const lista: Atalho[] = [
      {
        id: 'personagens',
        label: 'Personagens',
        hint: isMestre ? 'Todas as fichas da mesa' : 'Suas fichas e sua evolução',
        icon: <Users className="h-4 w-4" />,
        to: ROUTES.personagens,
      },
      {
        id: 'mercado',
        label: 'Mercado Global',
        hint: 'Mercadorias, preços e compras',
        icon: <Store className="h-4 w-4" />,
        to: ROUTES.mercado,
      },
      {
        id: 'grimorio',
        label: 'Grimório',
        hint: 'Escolas, tomos e magias',
        icon: <BookOpen className="h-4 w-4" />,
        to: ROUTES.grimorio,
      },
      {
        id: 'cronicas',
        label: 'Crônicas',
        hint: 'Relatos das sessões',
        icon: <ScrollText className="h-4 w-4" />,
        to: ROUTES.cronicas,
      },
    ];

    if (isMestre) {
      lista.push({
        id: 'painel-mestre',
        label: 'Painel do Mestre',
        hint: 'Permissões, limites e selos',
        icon: <Crown className="h-4 w-4" />,
        to: ROUTES.painelMestre,
      });
    }

    return lista;
  }, [isMestre]);

  return (
    <PainelSecao id="atalhos-titulo" icon={<ScrollText className="h-4 w-4" />} title="Atalhos" contentClassName="p-2.5">
      <ul className="space-y-1">
        {atalhos.map((atalho) => (
          <li key={atalho.id}>
            <Link
              to={atalho.to}
              className="group flex items-center gap-3 rounded-xs border border-transparent px-2.5 py-2.5 transition-colors hover:border-[#4b3823] hover:bg-[#1b120b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
            >
              <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs border border-[#4b3823] bg-[#1d140c] text-[#c6a66d] transition-colors group-hover:border-[#8c6b41] group-hover:text-[#f3dfaa]">
                {atalho.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-cinzel text-[11px] font-bold uppercase tracking-[0.12em] text-[#dcd1ba] group-hover:text-[#f3dfaa]">{atalho.label}</span>
                <span className="block truncate font-serif text-[11px] italic text-[#8f795e]">{atalho.hint}</span>
              </span>
              <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7d6a56] transition-colors group-hover:text-[#d1a85a]" />
            </Link>
          </li>
        ))}
      </ul>
    </PainelSecao>
  );
};

export default AtalhosPanel;
