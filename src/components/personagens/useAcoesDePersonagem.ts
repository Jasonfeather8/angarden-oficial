import { useState } from 'react';
import { invalidateAsyncDataCache } from '../../hooks/useAsyncData';
import { cacheKeyPrefixes } from '../../services/cacheKeys';
import { fichaService } from '../../services/fichaService';
import type { TenantCharacter } from '../../types';

export interface UseAcoesDePersonagemInput {
  characters: TenantCharacter[];
  searchTerm: string;
  limiteAtingido: boolean;
  reload: () => void;
  setActiveCharacterId: (id: string) => void;
  abrirFicha: (id: string) => void;
}

/**
 * Criação e exclusão de personagens do acervo. A exclusão reordena a seleção
 * para o primeiro personagem ainda visível pelo filtro corrente.
 */
export function useAcoesDePersonagem({
  characters,
  searchTerm,
  limiteAtingido,
  reload,
  setActiveCharacterId,
  abrirFicha,
}: UseAcoesDePersonagemInput) {
  const [createError, setCreateError] = useState<string | null>(null);

  const criarPersonagem = async () => {
    if (limiteAtingido) return;
    setCreateError(null);
    try {
      const newId = `char-${Date.now()}`;
      const newChar: TenantCharacter = {
        id: newId,
        name: 'NOVO PERSONAGEM',
        image: null,
        letter: 'N',
        isKnown: true,
        description: ['Novo personagem. Preencha os campos da ficha para definir sua identidade, atributos e habilidades.'],
      };

      // Inicializa ficha completamente vazia para ser preenchida
      await fichaService.createTenantCharacter(newChar);
      invalidateAsyncDataCache(cacheKeyPrefixes.acervoPersonagens);
      const blankFicha = fichaService.createBlankFicha(newId, '');
      await fichaService.saveFicha(newId, blankFicha);

      invalidateAsyncDataCache(cacheKeyPrefixes.acervoPersonagens);
      reload();
      setActiveCharacterId(newId);
      abrirFicha(newId);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : String(error));
    }
  };

  const excluirPersonagem = async (idToDelete: string) => {
    await fichaService.removeTenantCharacter(idToDelete);
    invalidateAsyncDataCache(cacheKeyPrefixes.acervoPersonagens);

    const updated = characters.filter((c) => c.id !== idToDelete);
    reload();

    const remainingFiltered = updated.filter((c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
    );
    if (remainingFiltered.length > 0) {
      setActiveCharacterId(remainingFiltered[0].id);
    } else {
      setActiveCharacterId('');
    }
  };

  return { createError, criarPersonagem, excluirPersonagem };
}
