import React from 'react';
import { SpellCard } from '../GrimorioSpellComponents';
import type { GrimorioSpell } from '../../mocks/grimorio';

/** Ações de cada card de magia, compartilhadas pelo livro e pelos resultados da busca. */
export interface AcoesDeMagia {
  learnedIds: string[];
  hiddenSpellIds: string[];
  canManageCatalog: boolean;
  canManageVisibility: boolean;
  onOpenSpell: (spell: GrimorioSpell) => void;
  onToggleLearned: (id: string) => void;
  onEdit: (spell: GrimorioSpell) => void;
  onToggleHidden: (id: string) => void;
  onDelete: (spell: GrimorioSpell) => void;
}

interface ListaDeMagiasProps {
  spells: GrimorioSpell[];
  acoes: AcoesDeMagia;
}

/** Sequência de cards de magia com o estado de aprendida/oculta de cada fórmula. */
export const ListaDeMagias = ({ spells, acoes }: ListaDeMagiasProps) => (
  <>
    {spells.map((spell) => <SpellCard
      key={spell.id}
      spell={spell}
      learned={acoes.learnedIds.includes(spell.id)}
      hidden={acoes.hiddenSpellIds.includes(spell.id)}
      canManage={acoes.canManageCatalog}
      canToggleHidden={acoes.canManageVisibility}
      onOpen={() => acoes.onOpenSpell(spell)}
      onToggleLearned={() => acoes.onToggleLearned(spell.id)}
      onEdit={() => acoes.onEdit(spell)}
      onToggleHidden={() => acoes.onToggleHidden(spell.id)}
      onDelete={() => acoes.onDelete(spell)}
    />)}
  </>
);
