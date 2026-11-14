import type { Campaign, CampaignMember } from '../types';
import { supabase } from '../integrations/supabase/client';

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
};

export default campaignService;
