import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isCollapsed: boolean;
  mobileOpen: boolean;
  /** Campanha ativa selecionada pelo usuário (dado real vindo do campaignService). */
  activeCampaignId: string | null;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobileOpen: () => void;
  setActiveCampaignId: (campaignId: string | null) => void;
}

/**
 * Estado de casca (UI) da aplicação.
 * Identidade, papéis e autorização vivem em `useSessionStore` + `src/auth/policies.ts`.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isCollapsed: false,
      mobileOpen: false,
      activeCampaignId: null,

      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setMobileOpen: (open) => set({ mobileOpen: open }),
      toggleMobileOpen: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
      setActiveCampaignId: (campaignId) => set({ activeCampaignId: campaignId }),
    }),
    {
      name: 'angarden:ui:app',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        activeCampaignId: state.activeCampaignId,
      }),
    }
  )
);
