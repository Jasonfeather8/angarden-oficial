import type {
  Campaign,
  CampaignInvite,
  CampaignInvitePreview,
  CampaignMember,
  Session,
} from '../types';
import { supabase } from '../integrations/supabase/client';

interface CampaignInviteRow extends CampaignInvite {
  expires_at: string;
}

export interface CampaignAccess {
  campaigns: Campaign[];
  members: CampaignMember[];
}

export const campaignService = {
  listCampaigns: async (): Promise<Campaign[]> => {
    const { data, error } = await supabase.from('campaigns').select('*');
    if (error) throw new Error(`Não foi possível carregar as campanhas: ${error.message}`);
    return data as Campaign[];
  },

  listMembers: async (): Promise<CampaignMember[]> => {
    const { data, error } = await supabase.from('campaign_members').select('*');
    if (error) throw new Error(`Não foi possível carregar os participantes: ${error.message}`);
    return data as CampaignMember[];
  },

  listAccessible: async (): Promise<CampaignAccess> => {
    const [campaigns, members] = await Promise.all([
      campaignService.listCampaigns(),
      campaignService.listMembers(),
    ]);
    return { campaigns, members };
  },

  getCampaign: async (id: string): Promise<Campaign | null> => {
    const { data, error } = await supabase.from('campaigns').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Não foi possível carregar a campanha: ${error.message}`);
    return data as Campaign | null;
  },

  createCampaign: async (
    { nome, descricao }: { nome: string; descricao?: string },
    session: Session
  ): Promise<Campaign> => {
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        tenant_id: session.user.tenant_id,
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        mestre_user_id: session.user.id,
      })
      .select('*')
      .single();
    if (campaignError) {
      throw new Error(`Não foi possível criar a campanha: ${campaignError.message}`);
    }

    const campaign = campaignData as Campaign;
    const { error: memberError } = await supabase.from('campaign_members').insert({
      campaign_id: campaign.id,
      user_id: session.user.id,
      papel: 'mestre',
      status: 'ativo',
      invited_by: null,
      joined_at: new Date().toISOString(),
    });
    if (memberError) {
      throw new Error(`A campanha foi criada, mas não foi possível registrar o mestre: ${memberError.message}`);
    }
    return campaign;
  },

  createInvite: async (campaignId: string): Promise<CampaignInvite> => {
    const { data, error } = await supabase.rpc('create_campaign_invite', {
      p_campaign_id: campaignId,
    });
    if (error) throw new Error(`Não foi possível gerar o convite: ${error.message}`);
    const invite = data as CampaignInviteRow;
    return {
      token: invite.token,
      campaign_id: invite.campaign_id,
      created_by: invite.created_by,
      created_at: invite.created_at,
    };
  },

  /**
   * Resolve um convite pelo token sem ler a linha de `campaign_invites`:
   * a RPC devolve apenas nome/descrição da campanha e se o usuário já é membro.
   */
  getInvitePreview: async (token: string): Promise<CampaignInvitePreview> => {
    const { data, error } = await supabase.rpc('get_campaign_invite_preview', {
      p_token: token,
    });
    if (error) throw new Error(error.message);

    const preview = data as {
      campaign_id: string;
      nome: string;
      descricao: string | null;
      ja_membro: boolean;
    };

    return {
      campaign_id: preview.campaign_id,
      nome: preview.nome,
      descricao: preview.descricao ?? undefined,
      ja_membro: preview.ja_membro,
    };
  },

  acceptInvite: async (token: string, session: Session): Promise<CampaignMember> => {
    const { data, error } = await supabase.rpc('accept_campaign_invite', { p_token: token });
    if (error) throw new Error(`Não foi possível aceitar o convite: ${error.message}`);
    return {
      campaign_id: data as string,
      user_id: session.user.id,
      papel: 'jogador',
      status: 'ativo',
      joined_at: new Date().toISOString(),
    };
  },

  removeMember: async (campaignId: string, userId: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('campaign_members')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .select('user_id');
    if (error) throw new Error(`Não foi possível remover o participante: ${error.message}`);
    return data.length > 0;
  },
};

export default campaignService;
