import React, { useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { AtalhosPanel } from '../components/dashboard/AtalhosPanel';
import { CompanhiaPanel } from '../components/dashboard/CompanhiaPanel';
import { ContinuarPanel } from '../components/dashboard/ContinuarPanel';
import { CronicasPanel } from '../components/dashboard/CronicasPanel';
import { HistoricoSessoesPanel } from '../components/dashboard/HistoricoSessoesPanel';
import { HistoricoXpPanel } from '../components/dashboard/HistoricoXpPanel';
import { MetricasDoReinoPanel } from '../components/dashboard/MetricasDoReinoPanel';
import { NovidadesMercadoPanel } from '../components/dashboard/NovidadesMercadoPanel';
import { PendenciasPanel } from '../components/dashboard/PendenciasPanel';
import { ProximaSessaoPanel } from '../components/dashboard/ProximaSessaoPanel';
import { SessaoFormModal } from '../components/dashboard/SessaoFormModal';
import { formatToday } from '../components/dashboard/formatters';
import { useAgendaDaSessao } from '../components/dashboard/useAgendaDaSessao';
import { useCatalogoDoReino } from '../components/dashboard/useCatalogoDoReino';
import { useCronicasRecentes } from '../components/dashboard/useCronicasRecentes';
import { useGovernancaDaMesa } from '../components/dashboard/useGovernancaDaMesa';
import { useHistoricoDeXp } from '../components/dashboard/useHistoricoDeXp';
import { useNovidadesDoMercado } from '../components/dashboard/useNovidadesDoMercado';
import { usePendenciasDaMesa } from '../components/dashboard/usePendenciasDaMesa';
import { useResumoDaMesa } from '../components/dashboard/useResumoDaMesa';
import { useSessaoForm } from '../components/dashboard/useSessaoForm';
import { useAsyncData } from '../hooks/useAsyncData';
import { useAuthorization } from '../hooks/useAuthorization';
import { cacheKeys } from '../services/cacheKeys';
import { tenantService } from '../services/tenantService';
import { useSessionStore } from '../store/useSessionStore';

export const DashboardPage: React.FC = () => {
  const user = useSessionStore((state) => state.session?.user ?? null);
  const { isMestre, tenantId, userId, role } = useAuthorization();
  const papelMestre = isMestre || role === 'admin';

  const { resumoQuery, fichasVisiveis, nomesPorFicha, continuar } = useResumoDaMesa(tenantId, papelMestre, userId);
  const {
    limitesQuery,
    limiteQuery,
    bloqueiosQuery,
    jogadores,
    totalJogadores,
    contagens,
    nomesPorJogador,
    partesSeladas,
  } = useGovernancaDaMesa(tenantId, papelMestre, userId);
  const catalogoQuery = useCatalogoDoReino(tenantId, role);
  const { sessaoQuery, presencasQuery, historicoSessoesQuery } = useAgendaDaSessao(tenantId);
  const novidadesQuery = useNovidadesDoMercado();
  const cronicasQuery = useCronicasRecentes(tenantId);
  const historicoQuery = useHistoricoDeXp(tenantId, papelMestre, userId, fichasVisiveis);
  const { pendencias, carregando, erro, recarregar } = usePendenciasDaMesa({
    fichasVisiveis,
    papelMestre,
    jogadores,
    contagens,
    partesSeladas,
    resumoQuery,
    limitesQuery,
    limiteQuery,
    bloqueiosQuery,
  });
  const sessaoForm = useSessaoForm(sessaoQuery.data, sessaoQuery.reload);

  const { data: cliente } = useAsyncData(
    () => (tenantId ? tenantService.getTenant(tenantId) : Promise.resolve(null)),
    [tenantId],
    { cacheKey: cacheKeys.cliente(tenantId), enabled: Boolean(tenantId) }
  );

  const primeiroNome = useMemo(() => {
    const nome = user?.nome_completo?.trim();
    return nome ? nome.split(/\s+/)[0] : '';
  }, [user?.nome_completo]);

  const hoje = useMemo(() => formatToday(new Date()), []);

  return (
    <>
      <PageShell
        id="page-dashboard"
        variant="amplo"
        title={
          <h2 className="flex items-center gap-2">
            <LayoutDashboard className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
            Início / Dashboard Geral
          </h2>
        }
        subtitle="Visão panorâmica da mesa e status do reino"
        headerRight={
          cliente ? (
            <div className="text-xs italic font-serif text-[#8c6b41]">Cliente · {cliente.nome}</div>
          ) : undefined
        }
      >
        <div className="space-y-5">
          <section
            aria-label="Contexto da mesa"
            className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-[#3a2c1d] bg-gradient-to-r from-[#1c130c] via-[#120c08] to-[#1c130c] px-4 py-3"
          >
            <p className="min-w-0 truncate font-cinzel text-base font-bold text-[#f0e2c0]">
              {primeiroNome ? `Bem-vindo de volta, ${primeiroNome}` : 'Bem-vindo de volta'}
            </p>
            <p className="font-serif text-xs capitalize italic text-[#8f795e]">{hoje}</p>
          </section>

          <MetricasDoReinoPanel
            papelMestre={papelMestre}
            fichasVisiveis={fichasVisiveis}
            jogadores={jogadores}
            partesSeladas={partesSeladas}
            resumoQuery={resumoQuery}
            limitesQuery={limitesQuery}
            catalogoQuery={catalogoQuery}
            limiteQuery={limiteQuery}
            bloqueiosQuery={bloqueiosQuery}
          />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
            <div className="space-y-4">
              <ProximaSessaoPanel
                isMestre={isMestre}
                papelMestre={papelMestre}
                userId={userId}
                totalJogadores={totalJogadores}
                temDadosDeJogadores={Boolean(limitesQuery.data)}
                sessaoQuery={sessaoQuery}
                presencasQuery={presencasQuery}
                onAgendar={sessaoForm.abrirAgendamento}
                onEditar={sessaoForm.abrirEdicao}
              />
              <HistoricoSessoesPanel
                isMestre={isMestre}
                podeAgendarOutra={Boolean(sessaoQuery.data) && !sessaoQuery.isLoading}
                historicoQuery={historicoSessoesQuery}
                onAgendar={sessaoForm.abrirAgendamento}
              />
              <CompanhiaPanel
                papelMestre={papelMestre}
                fichasVisiveis={fichasVisiveis}
                nomesPorJogador={nomesPorJogador}
                resumoQuery={resumoQuery}
              />
              <NovidadesMercadoPanel novidadesQuery={novidadesQuery} />
              <CronicasPanel papelMestre={papelMestre} cronicasQuery={cronicasQuery} />
            </div>

            <div className="space-y-4">
              <ContinuarPanel resumoQuery={resumoQuery} continuar={continuar} />
              <PendenciasPanel
                papelMestre={papelMestre}
                pendencias={pendencias}
                carregando={carregando}
                erro={erro}
                recarregar={recarregar}
              />
              <HistoricoXpPanel
                papelMestre={papelMestre}
                userId={userId}
                nomesPorFicha={nomesPorFicha}
                nomesPorJogador={nomesPorJogador}
                historicoQuery={historicoQuery}
                resumoQuery={resumoQuery}
              />
              <AtalhosPanel isMestre={isMestre} />
            </div>
          </div>
        </div>
      </PageShell>

      {isMestre && (
        <SessaoFormModal
          isOpen={sessaoForm.isOpen}
          modo={sessaoForm.modo}
          isSaving={sessaoForm.isSaving}
          form={sessaoForm.form}
          erro={sessaoForm.erro}
          onClose={sessaoForm.fechar}
          onChange={sessaoForm.atualizarCampo}
          onSubmit={sessaoForm.salvar}
        />
      )}
    </>
  );
};

export default DashboardPage;
