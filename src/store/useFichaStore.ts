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
  reset: () => void;
  setAuraModalOpen: (open: boolean) => void;
  setInventoryModalOpen: (open: boolean) => void;
  setPdfModalOpen: (open: boolean) => void;
}

/** Alterações da ficha são agrupadas antes de ir ao servidor. */
const SAVE_DEBOUNCE_MS = 1000;

let saveTimer: ReturnType<typeof setTimeout> | undefined;
let carregandoCharacterId: string | null = null;
let loadGeneration = 0;
const fichasEmMemoria = new Map<string, FichaCompleta>();
const fichasComAlteracoesPendentes = new Set<string>();

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
      if (salvo && fichasEmMemoria.get(characterId) === ficha) {
        fichasComAlteracoesPendentes.delete(characterId);
        // Só limpa o aviso se a ficha gravada ainda é a que está aberta na tela.
        if (get().characterId === characterId && get().ficha === ficha) {
          set({ hasUnsavedChanges: false });
        }
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
      const generation = ++loadGeneration;
      const cached = fichasEmMemoria.get(id);
      try {
        // Inicia a gravação pendente antes de selecionar a próxima ficha.
        const pendingSave = get().salvarPendente();
        const hasPendingChanges = fichasComAlteracoesPendentes.has(id);
        set({
          characterId: id,
          ficha: cached ?? null,
          isLoading: !cached,
          hasUnsavedChanges: hasPendingChanges,
          loadError: null,
        });
        if (hasPendingChanges) agendarGravacao();
        await pendingSave;
        if (generation !== loadGeneration) return;
        const hasPendingChangesAfterSave = fichasComAlteracoesPendentes.has(id);
        if (get().characterId === id) set({ hasUnsavedChanges: hasPendingChangesAfterSave });
        if (hasPendingChangesAfterSave) return;

        const loaded = await withTimeout(fichaService.getFicha(id));
        // Uma carga mais recente assumiu o controle: este resultado é obsoleto.
        if (generation !== loadGeneration) return;
        const current = get();
        if (current.characterId === id && current.hasUnsavedChanges) return;
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
        fichasComAlteracoesPendentes.delete(id);
        fichasEmMemoria.set(id, computed);
        set({ ficha: computed, isLoading: false, hasUnsavedChanges: false, loadError: null });
        void (async () => {
          try {
            await carregarLookupDeItens(refsLookup);
          } catch (error) {
            console.warn('Não foi possível aquecer a busca de itens da ficha:', error);
          }
        })();
      } catch (e) {
        console.error('Falha ao carregar ficha:', e);
        if (generation !== loadGeneration) return;
        set({
          ficha: cached ?? null,
          isLoading: false,
          loadError: cached
            ? null
            : e instanceof Error ? e.message : 'Não foi possível carregar a ficha do personagem.',
        });
      } finally {
        if (generation === loadGeneration) carregandoCharacterId = null;
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
      const characterId = get().characterId;
      fichasEmMemoria.set(characterId, calculated);
      fichasComAlteracoesPendentes.add(characterId);
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
      const generation = loadGeneration;
      try {
        const saved = await fichaService.saveFicha(characterId, ficha);
        if (generation !== loadGeneration) return;
        const stillCurrentFicha = saved && fichasEmMemoria.get(characterId) === ficha;
        const isOpenFicha = get().characterId === characterId && get().ficha === ficha;
        if (stillCurrentFicha) fichasComAlteracoesPendentes.delete(characterId);
        set({
          isSaving: false,
          hasUnsavedChanges: isOpenFicha && stillCurrentFicha ? false : get().hasUnsavedChanges,
          saveSuccessMessage: saved ? 'Ficha salva com sucesso!' : null,
        });
        setTimeout(() => {
          set({ saveSuccessMessage: null });
        }, 3000);
      } catch (e) {
        console.error('Erro ao salvar ficha:', e);
        if (generation === loadGeneration) set({ isSaving: false });
      }
    },

    reset: () => {
      cancelarGravacaoAgendada();
      fichasEmMemoria.clear();
      fichasComAlteracoesPendentes.clear();
      carregandoCharacterId = null;
      loadGeneration += 1;
      set({
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
      });
    },

    setAuraModalOpen: (open) => set({ isAuraModalOpen: open }),
    setInventoryModalOpen: (open) => set({ isInventoryModalOpen: open }),
    setPdfModalOpen: (open) => set({ isPdfModalOpen: open }),
  };
});

/**
 * A memória de fichas pertence a um usuário: ao entrar outro (ou ao sair), ela é descartada.
 * A assinatura fica aqui para o store de sessão não precisar conhecer o store da ficha.
 */
useSessionStore.subscribe((state, previous) => {
  const previousUserId = previous.session?.user.id ?? null;
  const currentUserId = state.session?.user.id ?? null;
  if (previousUserId !== currentUserId) {
    useFichaStore.getState().reset();
  }
});
