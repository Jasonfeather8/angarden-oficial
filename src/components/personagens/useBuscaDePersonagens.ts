import { useMemo, useState } from 'react';
import type { TenantCharacter } from '../../types';

/**
 * Termo de busca, seleção do personagem ativo e as listas derivadas
 * (a lista filtrada e o índice circular do personagem ativo).
 */
export function useBuscaDePersonagens(characters: TenantCharacter[]) {
  const [activeCharacterId, setActiveCharacterId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredCharacters = useMemo(
    () => characters.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())),
    [characters, searchTerm]
  );

  const activeCharacter =
    filteredCharacters.find((c) => c.id === activeCharacterId) ||
    filteredCharacters[0] ||
    null;

  const activeIndex = activeCharacter
    ? filteredCharacters.findIndex((c) => c.id === activeCharacter.id)
    : 0;

  return {
    searchTerm,
    setSearchTerm,
    activeCharacterId,
    setActiveCharacterId,
    filteredCharacters,
    activeCharacter,
    activeIndex,
  };
}
