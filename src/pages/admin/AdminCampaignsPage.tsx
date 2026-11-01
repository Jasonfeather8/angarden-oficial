import React from 'react';
import { Coins, Swords } from 'lucide-react';
import { Campaign, CampaignMember, Tenant, Usuario } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/Skeleton';
import { useAsyncData } from '../../hooks/useAsyncData';
import { campaignService } from '../../services/campaignService';
import { tenantService } from '../../services/tenantService';
import { profileService } from '../../services/profileService';

interface CampaignsData {
  campaigns: Campaign[];
  members: CampaignMember[];
  tenants: Tenant[];
  users: Usuario[];
}

export const AdminCampaignsPage: React.FC = () => {
  const { data, isLoading, error, reload } = useAsyncData<CampaignsData>(async () => {
    const [campaigns, members, tenants, users] = await Promise.all([
      campaignService.listCampaigns(),
      campaignService.listMembers(),
      tenantService.listTenants(),
      profileService.listProfiles(),
    ]);
    return { campaigns, members, tenants, users };
  }, [], { cacheKey: 'admin-campanhas' });

  if (isLoading) {
    return (
      <div className="py-10">
        <LoadingState variant="table" label="Reunindo as campanhas da plataforma…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <ErrorState description={error} onRetry={reload} />
      </div>
    );
  }

  const campaigns = data?.campaigns ?? [];
  const members = data?.members ?? [];
  const tenants = data?.tenants ?? [];
  const users = data?.users ?? [];

  const tenantNames = new Map(tenants.map((tenant) => [tenant.id, tenant.nome]));
  const userNames = new Map(users.map((user) => [user.id, user.nome_completo]));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 font-cinzel text-xl font-bold uppercase tracking-wider text-[#e6ddc5]">
          <Swords className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
          Campanhas da plataforma
        </h1>
        <p className="font-serif text-xs italic text-[#8c6b41]">
          Todas as mesas criadas, com o cliente e o mestre responsáveis
        </p>
      </header>

      {campaigns.length === 0 ? (
        <EmptyState
          icon={<Coins className="h-8 w-8" aria-hidden="true" />}
          title="Nenhuma campanha criada"
          description="Mestres ainda não criaram campanhas. Elas aparecerão aqui automaticamente."
        />
      ) : (
        <div className="overflow-x-auto border border-[#5a4225] bg-[#0c0806]/80">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Lista de campanhas da plataforma</caption>
            <thead>
              <tr className="border-b border-[#3a2c1d] bg-[#120f0d]">
                <th scope="col" className="px-4 py-3 font-cinzel text-[10px] uppercase tracking-widest text-[#a88d61]">Campanha</th>
                <th scope="col" className="px-4 py-3 font-cinzel text-[10px] uppercase tracking-widest text-[#a88d61]">Cliente</th>
                <th scope="col" className="px-4 py-3 font-cinzel text-[10px] uppercase tracking-widest text-[#a88d61]">Mestre</th>
                <th scope="col" className="px-4 py-3 font-cinzel text-[10px] uppercase tracking-widest text-[#a88d61]">Mesa</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const count = members.filter(
                  (member) => member.campaign_id === campaign.id
                ).length;
                return (
                  <tr key={campaign.id} className="border-b border-[#241a11] last:border-b-0">
                    <td className="px-4 py-3">
                      <p className="font-cinzel text-sm font-bold text-[#e6ddc5]">{campaign.nome}</p>
                      {campaign.descricao && (
                        <p className="font-serif text-[11px] italic text-[#8c6b41]">
                          {campaign.descricao}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-serif text-xs text-[#c4b9a3]">
                      {tenantNames.get(campaign.tenant_id) ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-serif text-xs text-[#c4b9a3]">
                      {userNames.get(campaign.mestre_user_id) ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-serif text-xs text-[#c4b9a3]">
                      {count} participante{count === 1 ? '' : 's'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCampaignsPage;
