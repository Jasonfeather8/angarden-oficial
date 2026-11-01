import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, LayoutDashboard, ScrollText, Users } from 'lucide-react';
import { Campaign, PerfilConta, Tenant } from '../../types';
import { GothicButton } from '../../components/GothicButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { LoadingState } from '../../components/ui/Skeleton';
import { useAsyncData } from '../../hooks/useAsyncData';
import { tenantService } from '../../services/tenantService';
import { profileService } from '../../services/profileService';
import { campaignService } from '../../services/campaignService';
import { fichaService } from '../../services/fichaService';
import { ROUTES } from '../../routes/paths';

interface OverviewData {
  tenants: Tenant[];
  profiles: PerfilConta[];
  campaigns: Campaign[];
  fichaCounts: Record<string, number>;
}

const StatCard: React.FC<{ label: string; value: number; hint: string }> = ({
  label,
  value,
  hint,
}) => (
  <div className="border border-[#5a4225] bg-[#0c0806]/80 p-4">
    <p className="font-cinzel text-[10px] font-bold uppercase tracking-widest text-[#a88d61]">
      {label}
    </p>
    <p className="mt-1 font-cinzel text-2xl font-bold text-[#f0e2c0]">{value}</p>
    <p className="mt-0.5 font-serif text-[11px] italic text-[#8c6b41]">{hint}</p>
  </div>
);

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading, error, reload } = useAsyncData<OverviewData>(async () => {
    const [tenants, profiles, campaigns] = await Promise.all([
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

    return { tenants, profiles, campaigns, fichaCounts };
  }, []);

  if (isLoading) {
    return (
      <div className="py-10">
        <LoadingState variant="cards" label="Compilando os registros da plataforma…" />
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
  const profiles = data?.profiles ?? [];
  const campaigns = data?.campaigns ?? [];
  const fichaCounts = data?.fichaCounts ?? {};

  const pending = profiles.filter((profile) => profile.status === 'pendente');
  const activeAccounts = profiles.filter((profile) => profile.status === 'ativo');
  const totalFichas = Object.values(fichaCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 font-cinzel text-xl font-bold uppercase tracking-wider text-[#e6ddc5]">
          <LayoutDashboard className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
          Visão geral da plataforma
        </h1>
        <p className="font-serif text-xs italic text-[#8c6b41]">
          Contas, clientes e campanhas sob sua administração
        </p>
      </header>

      {pending.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#8c6b41] bg-[#241a11]/95 px-4 py-3">
          <p className="flex items-center gap-2 font-serif text-sm text-[#e6ddc5]">
            <ScrollText className="h-4 w-4 text-[#d4af37]" aria-hidden="true" />
            {pending.length} solicitação{pending.length === 1 ? '' : 'ões'} aguardando aprovação.
          </p>
          <GothicButton size="xs" onClick={() => navigate(ROUTES.admin.solicitacoes)}>
            Revisar agora
          </GothicButton>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Clientes" value={tenants.length} hint="Isolamentos de dados ativos" />
        <StatCard label="Contas ativas" value={activeAccounts.length} hint="Acessos liberados" />
        <StatCard
          label="Solicitações pendentes"
          value={pending.length}
          hint="Aguardando sua análise"
        />
        <StatCard label="Campanhas" value={campaigns.length} hint="Mesas em toda a plataforma" />
        <StatCard label="Fichas técnicas" value={totalFichas} hint="Personagens criados" />
      </div>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-cinzel text-sm font-bold uppercase tracking-wider text-[#d8c9aa]">
          <Users className="h-4 w-4 text-[#a88d61]" aria-hidden="true" />
          Clientes recentes
        </h2>

        {tenants.length === 0 ? (
          <EmptyState
            icon={<Coins className="h-8 w-8" aria-hidden="true" />}
            title="Nenhum cliente cadastrado"
            description="Aprove uma solicitação de conta para criar o primeiro cliente da plataforma."
            action={
              <GothicButton size="sm" onClick={() => navigate(ROUTES.admin.solicitacoes)}>
                Ver solicitações
              </GothicButton>
            }
          />
        ) : (
          <ul className="divide-y divide-[#3a2c1d] border border-[#5a4225] bg-[#0c0806]/80">
            {tenants.slice(-5).reverse().map((tenant) => (
              <li key={tenant.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div>
                  <p className="font-cinzel text-sm font-bold text-[#e6ddc5]">{tenant.nome}</p>
                  <p className="font-serif text-[11px] uppercase tracking-wider text-[#8c6b41]">
                    {tenant.tipo === 'organizacao' ? 'Organização' : 'Individual'}
                  </p>
                </div>
                <span className="font-serif text-xs text-[#a88d61]">
                  {fichaCounts[tenant.id] ?? 0} ficha{(fichaCounts[tenant.id] ?? 0) === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminOverviewPage;
