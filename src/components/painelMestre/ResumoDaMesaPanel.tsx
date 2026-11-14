import React from 'react';
import { Coins, Pencil, ShoppingCart, Users } from 'lucide-react';
import { PlacaMetrica } from '../ui/PlacaMetrica';
import { TituloDeSecao } from './TituloDeSecao';
import type { ResumoDaMesa } from './usePermissoesDaMesa';

export interface ResumoDaMesaPanelProps {
  resumo: ResumoDaMesa;
}

/** Faixa de resumo do painel: fichas, edição, compra e tesouro da mesa. */
export const ResumoDaMesaPanel: React.FC<ResumoDaMesaPanelProps> = ({ resumo }) => (
  <section aria-label="Resumo da mesa" className="space-y-3">
    <TituloDeSecao
      extra={<span className="font-cinzel text-[9px] uppercase tracking-[0.16em] text-[#8f795e]">Tela 6 · Registro da mesa</span>}
    >
      Resumo da mesa
    </TituloDeSecao>
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      <PlacaMetrica icon={<Users className="h-4 w-4" />} valor={String(resumo.fichas)} rotulo={resumo.fichas === 1 ? 'Ficha na mesa' : 'Fichas na mesa'} />
      <PlacaMetrica icon={<Pencil className="h-4 w-4" />} valor={`${resumo.edicao}/${resumo.fichas}`} rotulo="Edição liberada" />
      <PlacaMetrica icon={<ShoppingCart className="h-4 w-4" />} valor={`${resumo.compra}/${resumo.fichas}`} rotulo="Compra liberada" />
      <PlacaMetrica icon={<Coins className="h-4 w-4" />} valor={`${resumo.tesouro} ◈`} rotulo="Tesouro da mesa" />
    </div>
  </section>
);

export default ResumoDaMesaPanel;
