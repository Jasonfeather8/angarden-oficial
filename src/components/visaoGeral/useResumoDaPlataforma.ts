import { useAsyncData } from '@/hooks/useAsyncData';
import { campaignService } from '@/services/campaignService';
import { fichaService } from '@/services/fichaService';
import { profileService } from '@/services/profileService';
import { tenantService } from '@/services/tenantService';
import type { Campaign, PerfilConta, Tenant } from '@/types';

interface OverviewData {
  tenants: Tenant[];
  profiles: PerfilConta[];
  campaigns: Campaign[];
  fichaCounts: Record<string, number>;
}

export const useResumoDaPlataforma = () => {
  const { data, isLoading, error, reload } = useAsyncData<OverviewData>(async () => {
    const [tenants, profiles, campaigns] = await Promise.all([
      tenantService.listTenants(),
      profileService.listProfiles(),
      campaignService.listCampaigns(),
    ]);

    const fichaCounts = await fichaService.contarFichasPorCliente();

    return { tenants, profiles, campaigns, fichaCounts };
  }, [], { cacheKey: 'admin-overview' });

  const tenants = data?.tenants ?? [];
  const profiles = data?.profiles ?? [];
  const campaigns = data?.campaigns ?? [];
  const fichaCounts = data?.fichaCounts ?? {};
  const pending = profiles.filter((profile) => profile.status === 'pendente');
  const activeAccounts = profiles.filter((profile) => profile.status === 'ativo');
  const totalFichas = Object.values(fichaCounts).reduce((sum, count) => sum + count, 0);

  return {
    isLoading,
    error,
    reload,
    tenants,
    profiles,
    campaigns,
    fichaCounts,
    pending,
    activeAccounts,
    totalFichas,
  };
};
