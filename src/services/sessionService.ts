import type { User } from '@supabase/supabase-js';
import { supabase } from '../integrations/supabase/client';
import type { Session, UserRole, UserStatus } from '../types';

export interface SignInResult {
  session?: Session;
  error?: string;
}

export function sessionFromSupabaseUser(user: User): Session | null {
  const app = user.app_metadata ?? {};
  const meta = user.user_metadata ?? {};
  if (app.status !== 'ativo' || !app.role) return null;

  const email = user.email ?? '';
  return {
    user: {
      id: user.id,
      nome_completo:
        (typeof meta.nome_completo === 'string' && meta.nome_completo) ||
        email.split('@')[0] ||
        'Aventureiro',
      whatsapp: typeof meta.whatsapp === 'string' ? meta.whatsapp : '',
      avatar_url: typeof meta.avatar_url === 'string' ? meta.avatar_url : undefined,
      email,
      role: app.role as UserRole,
      status: app.status as UserStatus,
      tenant_id: typeof app.tenant_id === 'string' ? app.tenant_id : null,
      data_cadastro: user.created_at,
    },
    tenant: null,
    issued_at: new Date().toISOString(),
  };
}

export const sessionService = {
  getSession: async (): Promise<Session | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session ? sessionFromSupabaseUser(data.session.user) : null;
  },

  signIn: async (email: string, senha: string): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes('email not confirmed')) {
        return { error: 'Confirme seu email antes de entrar.' };
      }
      if (message.includes('invalid login credentials')) {
        return { error: 'Email ou senha inválidos.' };
      }
      return { error: 'Não foi possível entrar. Tente novamente.' };
    }

    const session = data.session ? sessionFromSupabaseUser(data.session.user) : null;
    return session ? { session } : { error: 'Sua conta ainda não foi aprovada pelo administrador.' };
  },

  signOut: async (): Promise<void> => {
    await supabase.auth.signOut();
  },

  onAuthStateChange: (callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) => {
    const { data } = supabase.auth.onAuthStateChange(callback);
    return () => data.subscription.unsubscribe();
  },
};

export default sessionService;
