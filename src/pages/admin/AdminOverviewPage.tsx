import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { AvisoSolicitacoesPendentes } from '@/components/visaoGeral/AvisoSolicitacoesPendentes';
import { ClientesRecentesPanel } from '@/components/visaoGeral/ClientesRecentesPanel';
import { MetricasDaPlataforma } from '@/components/visaoGeral/MetricasDaPlataforma';
import { useResumoDaPlataforma } from '@/components/visaoGeral/useResumoDaPlataforma';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';

export const AdminOverviewPage: React.FC = () => {
  const {
    isLoading,
    error,
    reload,
    tenants,
    fichaCounts,
    pending,
    activeAccounts,
    campaigns,
    totalFichas,
  } = useResumoDaPlataforma();

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

      <AvisoSolicitacoesPendentes quantidade={pending.length} />
      <MetricasDaPlataforma
        clientes={tenants.length}
        contasAtivas={activeAccounts.length}
        solicitacoesPendentes={pending.length}
        campanhas={campaigns.length}
        fichasTecnicas={totalFichas}
      />
      <ClientesRecentesPanel clientes={tenants} fichasPorCliente={fichaCounts} />
    </div>
  );
};

export default AdminOverviewPage;
