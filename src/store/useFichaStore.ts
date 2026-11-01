import { create } from 'zustand';
import { FichaCompleta } from '../types';
import { fichaService } from '../services/fichaService';
import { withTimeout } from '../utils/withTimeout';
import { policies } from '../auth/policies';
import { useSessionStore } from './useSessionStore';
import { carregarLookupDeItens, MercadoLookupRef } from '../services/mercadoService';

interface FichaStoreState {
  characterId: string;
  ficha: FichaCompleta | null;
  isLoading: boolean;
  loadError: string | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  saveSuccessMessage: string | null;
  isAuraModalOpen: boolean;
  isInventoryModalOpen: boolean;
  isPdfModalOpen: boolean;

  setCharacterId: (id: string) => void;
  loadFicha: (id: string) => Promise<void>;
  reloadFicha: () => Promise<void>;
  updateFicha: (updater: (prev: FichaCompleta) => FichaCompleta) => void;
  saveCurrentFicha: () => Promise<void>;
  /** Grava imediatamente o que estiver pendente (troca de personagem, saída da tela, botão Salvar). */
  salvarPendente: () => Promise<void>;
  setAuraModalOpen: (open: boolean) => void;
  setInventoryModalOpen: (open: boolean) => void;
  setPdfModalOpen: (open: boolean) => void;
}

/** Alterações da ficha são agrupadas antes de ir ao servidor. */
const SAVE_DEBOUNCE_MS = 1000;

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let carregandoCharacterId: string | null = null;

function cancelarGravacaoAgendada() {
  if (saveTimer !== undefined) {
    clearTimeout(saveTimer);
    saveTimer = undefined;
  }
}

export const useFichaStore = create<FichaStoreState>((set, get) => {
  const gravarFicha = async (characterId: string, ficha: FichaCompleta) => {
    try {
      const salvo = await fichaService.saveFicha(characterId, ficha);
      // Só limpa o aviso se a ficha gravada ainda é a que está aberta na tela.
      if (salvo && get().characterId === characterId && get().ficha === ficha) {
        set({ hasUnsavedChanges: false });
      }
    } catch (error) {
      console.warn('Persistência em background:', error);
    }
  };

  const agendarGravacao = () => {
    cancelarGravacaoAgendada();
    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      const { characterId, ficha, hasUnsavedChanges } = get();
      if (!ficha || !hasUnsavedChanges) return;
      void gravarFicha(characterId, ficha);
    }, SAVE_DEBOUNCE_MS);
  };

  return {
    characterId: '',
    ficha: null,
    isLoading: false,
    loadError: null,
    isSaving: false,
    hasUnsavedChanges: false,
    saveSuccessMessage: null,
    isAuraModalOpen: false,
    isInventoryModalOpen: false,
    isPdfModalOpen: false,

    salvarPendente: async () => {
      cancelarGravacaoAgendada();
      const { characterId, ficha, hasUnsavedChanges } = get();
      if (!ficha || !hasUnsavedChanges) return;
      await gravarFicha(characterId, ficha);
    },

    setCharacterId: (id) => {
      void get().loadFicha(id);
    },

    loadFicha: async (id) => {
      // Evita carregar a mesma ficha duas vezes quando a navegação e o efeito da página coincidem.
      if (carregandoCharacterId === id) return;
      carregandoCharacterId = id;
      try {
        // Nada pode ser perdido ao trocar de personagem.
        await get().salvarPendente();

        const current = get().ficha;
        if (!current || get().characterId !== id) {
          set({ isLoading: true, characterId: id, loadError: null });
        } else {
          set({ characterId: id, loadError: null });
        }

        const loaded = await withTimeout(fichaService.getFicha(id));
        // Uma carga mais recente assumiu o controle: este resultado é obsoleto.
        if (carregandoCharacterId !== id) return;
        const computed = fichaService.calcularEngine(loaded);
        const refsLookup: MercadoLookupRef[] = [
          ...computed.suporte.inventario.map((item) => ({ id: item.id, nome: item.item || item.nome })),
          { nome: computed.suporte.armadura.nome },
          { nome: computed.suporte.montaria?.nome },
          { nome: computed.suporte.armamento.arma_primaria?.nome },
          { nome: computed.suporte.armamento.segunda_arma?.nome },
          { nome: computed.suporte.armamento.arma_suporte?.nome },
          { nome: computed.suporte.armamento.arco_ld?.nome },
        ];
        try {
          await carregarLookupDeItens(refsLookup);
        } catch (error) {
          console.warn('Não foi possível aquecer a busca de itens da ficha:', error);
        }
        set({ ficha: computed, isLoading: false, hasUnsavedChanges: false, loadError: null });
      } catch (e) {
        console.error('Falha ao carregar ficha:', e);
        set({
          ficha: null,
          isLoading: false,
          loadError:
            e instanceof Error ? e.message : 'Não foi possível carregar a ficha do personagem.',
        });
      } finally {
        if (carregandoCharacterId === id) carregandoCharacterId = null;
      }
    },

    reloadFicha: async () => {
      const { characterId, loadFicha } = get();
      await loadFicha(characterId);
    },

    updateFicha: (updater) => {
      const current = get().ficha;
      if (!current) return;

      // Barreira de autorização: a edição precisa ser permitida pelas policies.
      if (!policies.canEditFicha(useSessionStore.getState().session, current)) {
        console.warn('Edição bloqueada: a ficha não está liberada para este usuário.');
        return;
      }

      const updated = updater(current);
      const calculated = fichaService.calcularEngine(updated);
      set({ ficha: calculated, hasUnsavedChanges: true });
      agendarGravacao();
    },

    saveCurrentFicha: async () => {
      const { characterId, ficha } = get();
      if (!ficha) return;
      if (!policies.canEditFicha(useSessionStore.getState().session, ficha)) {
        console.warn('Edição bloqueada: a ficha não está liberada para este usuário.');
        return;
      }
      cancelarGravacaoAgendada();
      set({ isSaving: true });
      try {
        await fichaService.saveFicha(characterId, ficha);
        set({
          isSaving: false,
          hasUnsavedChanges: false,
          saveSuccessMessage: 'Ficha salva com sucesso!',
        });
        setTimeout(() => {
          set({ saveSuccessMessage: null });
        }, 3000);
      } catch (e) {
        console.error('Erro ao salvar ficha:', e);
        set({ isSaving: false });
      }
    },

    setAuraModalOpen: (open) => set({ isAuraModalOpen: open }),
    setInventoryModalOpen: (open) => set({ isInventoryModalOpen: open }),
    setPdfModalOpen: (open) => set({ isPdfModalOpen: open }),
  };
});
