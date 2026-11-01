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
  setAuraModalOpen: (open: boolean) => void;
  setInventoryModalOpen: (open: boolean) => void;
  setPdfModalOpen: (open: boolean) => void;
}

export const useFichaStore = create<FichaStoreState>((set, get) => ({
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

  setCharacterId: (id: string) => {
    set({ characterId: id });
    get().loadFicha(id);
  },

  loadFicha: async (id: string) => {
    const current = get().ficha;
    // Só ativa o estado de loading visível se ainda não houver ficha carregada ou se trocou de personagem
    if (!current || get().characterId !== id) {
      set({ isLoading: true, characterId: id, loadError: null });
    } else {
      set({ characterId: id, loadError: null });
    }
    try {
      const loaded = await withTimeout(fichaService.getFicha(id));
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
    const cid = get().characterId;
    fichaService.saveFicha(cid, calculated).catch((err) => {
      console.warn('Persistência em background:', err);
    });
  },

  saveCurrentFicha: async () => {
    const { characterId, ficha } = get();
    if (!ficha) return;
    if (!policies.canEditFicha(useSessionStore.getState().session, ficha)) {
      console.warn('Edição bloqueada: a ficha não está liberada para este usuário.');
      return;
    }
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
}));
