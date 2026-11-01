import type { AprovacaoSolicitacaoInput, PerfilConta, UserRole } from '../types';
import { supabase } from '../integrations/supabase/client';

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
  };
}

export const profileService = {
  listProfiles: async (): Promise<PerfilConta[]> => {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw new Error(`Não foi possível carregar os perfis: ${error.message}`);
    return (data as ProfileRow[]).map(mapProfile);
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
