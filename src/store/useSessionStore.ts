import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Session, Usuario } from '../types';
import { sessionFromSupabaseUser, sessionService } from '../services/sessionService';
import { queryClient } from '../services/queryClient';
import { invalidateAsyncDataCache } from '../hooks/useAsyncData';

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous' | 'recovery';

interface SessionState {
  session: Session | null;
  status: SessionStatus;
  accountNotice: string | null;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  applyUser: (user: Usuario) => void;
  endRecovery: () => void;
}

let unsubscribeAuth: (() => void) | null = null;

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  status: 'loading',
  accountNotice: null,

  initialize: async () => {
    if (!unsubscribeAuth) {
      unsubscribeAuth = sessionService.onAuthStateChange(async (event, authSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          set({ status: 'recovery' });
          return;
        }

        if (!authSession) {
          queryClient.clear();
          invalidateAsyncDataCache();
          set((state) => ({
            session: null,
            status: state.status === 'recovery' ? 'recovery' : 'anonymous',
          }));
          return;
        }

        const user: User = authSession.user;
        const session = sessionFromSupabaseUser(user);
        if (session) {
          set({ session, status: 'authenticated', accountNotice: null });
          return;
        }

        const status = user.app_metadata?.status;
        const accountNotice =
          status === 'pendente'
            ? 'Sua solicitação de conta está em análise pelo administrador.'
            : status === 'recusado'
              ? 'Sua solicitação de conta foi recusada. Entre em contato com o suporte.'
              : 'Sua conta ainda não foi aprovada pelo administrador.';
        void sessionService.signOut();
        set({ session: null, status: 'anonymous', accountNotice });
      });
    }

    await get().refresh();
  },

  signOut: async () => {
    await sessionService.signOut();
    queryClient.clear();
    invalidateAsyncDataCache();
    set({ session: null, status: 'anonymous', accountNotice: null });
  },

  refresh: async () => {
    const session = await sessionService.getSession();
    // Na recuperação de senha o status não pode ser sobrescrito: o link de recuperação
    // cria uma sessão válida ANTES de o usuário definir a nova senha. Sem esta guarda,
    // o boot jogaria o usuário no dashboard sem que ele trocasse a senha.
    if (get().status === 'recovery') {
      set({ session });
      return;
    }
    set(session ? { session, status: 'authenticated', accountNotice: null } : { session: null, status: 'anonymous' });
  },

  applyUser: (user) => {
    const current = get().session;
    if (!current) return;
    set({ session: { ...current, user } });
  },

  endRecovery: () => {
    void (async () => {
      const session = await sessionService.getSession();
      set(session ? { session, status: 'authenticated', accountNotice: null } : { session: null, status: 'anonymous' });
    })();
  },
}));

export default useSessionStore;
