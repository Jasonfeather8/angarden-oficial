import type { AtualizacaoPerfil, Usuario } from '../types';
import { supabase } from '../integrations/supabase/client';
import { sessionFromSupabaseUser } from './sessionService';

export interface AuthResult {
  user?: Usuario;
  error?: string;
}

function validateProfileInput(input: AtualizacaoPerfil): string | null {
  const nome = input.nome_completo.trim();
  const whatsapp = input.whatsapp.trim();
  const avatarUrl = input.avatar_url?.trim() || '';

  if (nome.length < 2 || nome.length > 120) return 'Informe um nome completo válido.';
  if (whatsapp.length < 8 || whatsapp.length > 30) return 'Informe um WhatsApp válido.';
  if (avatarUrl && !/^(https?:\/\/|data:image\/)/i.test(avatarUrl)) {
    return 'Informe um endereço de foto válido.';
  }
  if (avatarUrl.length > 2_000_000) return 'A foto selecionada é muito grande.';
  if (input.nova_senha && (input.nova_senha.length < 6 || input.nova_senha.length > 128)) {
    return 'A nova senha deve ter entre 6 e 128 caracteres.';
  }
  return null;
}

export const authService = {
  atualizarUsuario: async (userId: string, input: AtualizacaoPerfil): Promise<AuthResult> => {
    void userId;
    const validationError = validateProfileInput(input);
    if (validationError) return { error: validationError };

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          nome_completo: input.nome_completo.trim(),
          whatsapp: input.whatsapp.trim(),
          avatar_url: input.avatar_url?.trim() || undefined,
        },
        ...(input.nova_senha ? { password: input.nova_senha } : {}),
      });

      if (error) return { error: 'Não foi possível atualizar seu perfil. Tente novamente.' };

      const user = sessionFromSupabaseUser(data.user)?.user;
      if (!user) return { error: 'Não foi possível validar sua conta. Entre novamente.' };
      return { user };
    } catch {
      return { error: 'Não foi possível atualizar seu perfil. Tente novamente.' };
    }
  },
};

export default authService;
