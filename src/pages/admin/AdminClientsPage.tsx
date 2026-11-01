import React from 'react';
import { Building2, Users } from 'lucide-react';
import { Tenant, Usuario } from '../../types';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/Skeleton';
import { useAsyncData } from '../../hooks/useAsyncData';
import { tenantService } from '../../services/tenantService';
import { profileService } from '../../services/profileService';
import { fichaService } from '../../services/fichaService';
import { campaignService } from '../../services/campaignService';
import { ROLE_LABELS } from '../../auth/policies';

interface ClientsData {
  tenants: Tenant[];
  users: Usuario[];
  fichaCounts: Record<string, number>;
  campaignCounts: Record<string, number>;
}

export const AdminClientsPage: React.FC = () => {
  const { data, isLoading, error, reload } = useAsyncData<ClientsData>(async () => {
    const [tenants, users, campaigns] = await Promise.all([
      tenantService.listTenants(),
      profileService.listProfiles(),
      campaignService.listCampaigns(),
    ]);

    const fichaCounts: Record<string, number> = {};
    await Promise.all(
      tenants.map(async (tenant) => {
        fichaCounts[tenant.id] = await fichaService.countFichas(tenant.id);
      })
    );

    const campaignCounts: Record<string, number> = {};
    campaigns.forEach((campaign) => {
      campaignCounts[campaign.tenant_id] = (campaignCounts[campaign.tenant_id] ?? 0) + 1;
    });

    return { tenants, users, fichaCounts, campaignCounts };
  }, []);

  if (isLoading) {
    return (
      <div className="py-10">
        <LoadingState variant="cards" label="Listando os clientes da plataforma…" />
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

  const tenants = data?.tenants ?? [];
  const users = data?.users ?? [];
  const fichaCounts = data?.fichaCounts ?? {};
  const campaignCounts = data?.campaignCounts ?? {};

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 font-cinzel text-xl font-bold uppercase tracking-wider text-[#e6ddc5]">
          <Building2 className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
          Clientes e contas
        </h1>
        <p className="font-serif text-xs italic text-[#8c6b41]">
          Cada cliente é um isolamento de dados independente
        </p>
      </header>

      {tenants.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-8 w-8" aria-hidden="true" />}
          title="Nenhum cliente cadastrado"
          description="Aprove uma solicitação de conta para criar o primeiro cliente."
        />
      ) : (
        <ul className="space-y-4">
          {tenants.map((tenant) => {
            const tenantUsers = users.filter((user) => user.tenant_id === tenant.id);
            return (
              <li key={tenant.id} className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="font-cinzel text-base font-bold text-[#f0e2c0]">{tenant.nome}</h2>
                    <p className="font-serif text-[11px] uppercase tracking-wider text-[#8c6b41]">
                      {tenant.tipo === 'organizacao' ? 'Organização' : 'Individual'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 font-serif text-xs text-[#a88d61]">
                    <span>{tenantUsers.length} conta{tenantUsers.length === 1 ? '' : 's'}</span>
                    <span>{fichaCounts[tenant.id] ?? 0} ficha{(fichaCounts[tenant.id] ?? 0) === 1 ? '' : 's'}</span>
                    <span>
                      {campaignCounts[tenant.id] ?? 0} campanha
                      {(campaignCounts[tenant.id] ?? 0) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {tenantUsers.length > 0 && (
                  <ul className="mt-3 divide-y divide-[#241a11] border-t border-[#3a2c1d]">
                    {tenantUsers.map((user) => (
                      <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-[#8c6b41]" aria-hidden="true" />
                          <div>
                            <p className="font-serif text-xs text-[#dcd1ba]">{user.nome_completo}</p>
                            <p className="font-serif text-[11px] text-[#8c6b41]">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="border border-[#5a4225] px-2 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-[#d4af37]">
                            {ROLE_LABELS[user.role]}
                          </span>
                          <span
                            className={
                              user.status === 'ativo'
                                ? 'border border-emerald-800/70 bg-emerald-950/40 px-2 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-emerald-300'
                                : 'border border-[#5a4225] px-2 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-[#a88d61]'
                            }
                          >
                            {user.status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AdminClientsPage;
