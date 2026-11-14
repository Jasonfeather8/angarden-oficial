import { useEffect, useState } from 'react';
import { useFichaStore } from '../../store/useFichaStore';
import { fichaService } from '../../services/fichaService';
import { cacheKeys } from '../../services/cacheKeys';
import { useAsyncData } from '../../hooks/useAsyncData';
import type { PersonagemResumo } from '../ModalSelecionarComprador';

/**
 * Comitiva do cliente autenticado e o personagem cujas magias aprendidas
 * estão sendo consultadas, espelhado no store global da ficha.
 */
export function usePersonagemDoGrimorio(tenantId: string | null) {
  const storeCharacterId = useFichaStore((state) => state.characterId);
  const setStoreCharacterId = useFichaStore((state) => state.setCharacterId);
  const [personagemId, setPersonagemId] = useState<string>(() => storeCharacterId);
  const [selecaoAberta, setSelecaoAberta] = useState(false);

  const {
    data: listaPersonagensData,
    isLoading: isLoadingPersonagens,
    error: erroPersonagensHook,
    reload: reloadPersonagens,
  } = useAsyncData(() => fichaService.getListaPersonagens(), [tenantId], {
    cacheKey: cacheKeys.personagensResumo(tenantId),
    enabled: Boolean(tenantId),
  });
  const listaPersonagens: PersonagemResumo[] = listaPersonagensData ?? [];
  const erroPersonagens = erroPersonagensHook === 'Não foi possível carregar os dados.'
    ? 'Não foi possível carregar a lista de personagens do grimório.'
    : erroPersonagensHook;

  useEffect(() => {
    if (listaPersonagens.length > 0 && !listaPersonagens.some((personagem) => personagem.id === personagemId)) {
      const personagemFallback = listaPersonagens[0];
      setPersonagemId(personagemFallback.id);
      setStoreCharacterId(personagemFallback.id);
    }
  }, [listaPersonagens, personagemId, setStoreCharacterId]);

  const selectedPersonagem = listaPersonagens.find((personagem) => personagem.id === personagemId);
  const selectCharacter = (id: string) => {
    setPersonagemId(id);
    setStoreCharacterId(id);
  };

  return {
    personagemId,
    listaPersonagens,
    isLoadingPersonagens,
    erroPersonagens,
    reloadPersonagens,
    selectedPersonagem,
    selectCharacter,
    selecaoAberta,
    abrirSelecao: () => setSelecaoAberta(true),
    fecharSelecao: () => setSelecaoAberta(false),
  };
}
