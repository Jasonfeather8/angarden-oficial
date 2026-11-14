import { useState } from 'react';
import type { GrimorioSpell } from '../../mocks/grimorio';

/** Magia aberta na tela de detalhes do Grimório. */
export function useDetalhesDaMagia() {
  const [selectedSpell, setSelectedSpell] = useState<GrimorioSpell | null>(null);

  const abrirDetalhes = (spell: GrimorioSpell) => setSelectedSpell(spell);
  const fecharDetalhes = () => setSelectedSpell(null);
  const limparSeMagiaAtual = (spellId: string) =>
    setSelectedSpell((current) => (current?.id === spellId ? null : current));

  return { selectedSpell, abrirDetalhes, fecharDetalhes, limparSeMagiaAtual };
}
