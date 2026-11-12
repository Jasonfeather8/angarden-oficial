import type { AprovacaoSolicitacaoInput, PerfilConta, UserRole } from '../types';
import { supabase } from '../integrations/supabase/client';
import { useSessionStore } from '../store/useSessionStore';

interface ProfileRow {
  id: string;
  email: string;
  nome_completo: string;
  whatsapp: string;
  avatar_url: string | null;
  role: UserRole;
  status: PerfilConta['status'];
  tenant_id: string | null;
  motivo_recusa: string | null;
  limite_fichas: number | null;
  created_at: string;
  updated_at: string;
}

function mapProfile(row: ProfileRow): PerfilConta {
  return {
    id: row.id,
    email: row.email,
    nome_completo: row.nome_completo,
    whatsapp: row.whatsapp,
    avatar_url: row.avatar_url ?? undefined,
    role: row.role,
    status: row.status,
    tenant_id: row.tenant_id,
    data_cadastro: row.created_at,
    updated_at: row.updated_at,
    motivo_recusa: row.motivo_recusa ?? undefined,
    limite_fichas: row.limite_fichas ?? 10,
  };
}

export const profileService = {
  listProfiles: async (): Promise<PerfilConta[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw new Error(`Não foi possível carregar os perfis: ${error.message}`);
    return (data as ProfileRow[]).map(mapProfile);
  },

  listarDoCliente: async (tenantId: string): Promise<PerfilConta[]> => {
    const { data, error } = await supabase.from('profiles').select('*').eq('tenant_id', tenantId);
    if (error) throw new Error(`Não foi possível carregar os perfis do cliente: ${error.message}`);
    return (data as ProfileRow[]).map(mapProfile);
  },

  getLimiteFichas: async (userId: string): Promise<number> => {
    const tenantId = useSessionStore.getState().session?.user.tenant_id;
    if (!tenantId) throw new Error('Não foi possível carregar o limite de fichas: cliente indefinido.');
    const { data, error } = await supabase
      .from('profiles')
      .select('limite_fichas')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (error) throw new Error(`Não foi possível carregar o limite de fichas: ${error.message}`);
    return data?.limite_fichas ?? 10;
  },

  atualizarLimiteFichas: async (userId: string, limite: number): Promise<void> => {
    if (!Number.isInteger(limite) || limite < 0 || limite > 1000) {
      throw new Error('O limite de fichas deve ser um número inteiro entre 0 e 1000.');
    }
    const tenantId = useSessionStore.getState().session?.user.tenant_id;
    if (!tenantId) throw new Error('Não foi possível atualizar o limite de fichas: cliente indefinido.');
    const { data, error } = await supabase
      .from('profiles')
      .update({ limite_fichas: limite })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select('id')
      .maybeSingle();
    if (error) throw new Error(`Não foi possível atualizar o limite de fichas: ${error.message}`);
    if (!data) throw new Error('Não foi possível atualizar o limite de fichas: perfil não encontrado neste cliente.');
  },

  approveAccount: async (
    userId: string,
    input: AprovacaoSolicitacaoInput
  ): Promise<PerfilConta> => {
    const { data, error } = await supabase.rpc('approve_account', {
      p_user_id: userId,
      p_tipo: input.tipo,
      p_role: input.role,
      p_nome_tenant: input.nome_tenant ?? null,
      p_tenant_id: input.tenant_id ?? null,
    });
    if (error) throw new Error(`Não foi possível aprovar a solicitação: ${error.message}`);
    return mapProfile(data as ProfileRow);
  },

  rejectAccount: async (userId: string, reason: string): Promise<void> => {
    const { error } = await supabase.rpc('reject_account', {
      p_user_id: userId,
      p_motivo: reason.trim() || null,
    });
    if (error) throw new Error(`Não foi possível recusar a solicitação: ${error.message}`);
  },
};

export default profileService;
