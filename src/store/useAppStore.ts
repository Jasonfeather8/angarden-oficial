import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  isCollapsed: boolean;
  mobileOpen: boolean;
  lastCharacterId: string | null;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
  setMobileOpen: (open: boolean) => void;
  toggleMobileOpen: () => void;
  setLastCharacterId: (characterId: string | null) => void;
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
      lastCharacterId: null,

      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
      setMobileOpen: (open) => set({ mobileOpen: open }),
      toggleMobileOpen: () => set((state) => ({ mobileOpen: !state.mobileOpen })),
      setLastCharacterId: (characterId) => set({ lastCharacterId: characterId }),
    }),
    {
      name: 'angarden:ui:app',
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        lastCharacterId: state.lastCharacterId,
      }),
    }
  )
);
