import React, { useState } from 'react';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { CapaDaSessaoPanel } from '@/components/cronicas/CapaDaSessaoPanel';
import { CompartilharCronicaModal } from '@/components/cronicas/CompartilharCronicaModal';
import { CronicaAcoesBar } from '@/components/cronicas/CronicaAcoesBar';
import { DestaquesDaCronicaPanel } from '@/components/cronicas/DestaquesDaCronicaPanel';
import { ExcluirCronicaModal } from '@/components/cronicas/ExcluirCronicaModal';
import { NotasDaCronicaPanel } from '@/components/cronicas/NotasDaCronicaPanel';
import { NovaCronicaModal } from '@/components/cronicas/NovaCronicaModal';
import { ProgressoDaCronicaPanel } from '@/components/cronicas/ProgressoDaCronicaPanel';
import { RegistroSelecionadoPanel } from '@/components/cronicas/RegistroSelecionadoPanel';
import { useCategoriasDaCronica } from '@/components/cronicas/useCategoriasDaCronica';
import { useCronicaForm } from '@/components/cronicas/useCronicaForm';
import { useCronicas } from '@/components/cronicas/useCronicas';
import { useParticipantesDaCronica } from '@/components/cronicas/useParticipantesDaCronica';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { ToolbarButton } from '@/components/ui/ToolbarButton';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROUTES } from '@/routes/paths';

export const CronicaDetalhePage: React.FC = () => {
  const { cronicaId } = useParams<{ cronicaId: string }>();
  const { isAdmin, tenantId, userId } = useAuthorization();
  const { cronicas, isLoading, error, reload } = useCronicas(tenantId);
  const cronica = cronicas.find((item) => item.id === cronicaId) ?? null;
  const participantes = useParticipantesDaCronica(cronica?.id ?? null);
  const categorias = useCategoriasDaCronica(tenantId);
  const navigate = useNavigate();
  const [excluindo, setExcluindo] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const formulario = useCronicaForm({ onSalva: () => reload() });

  const podeGerir = Boolean(cronica && (isAdmin || cronica.criadaPor === userId));
  const voltar = () => navigate(ROUTES.cronicas);

  return (
    <>
      <PageShell
        id="page-cronica"
        variant="padrao"
        title={
          <h1 className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
            Crônicas da Campanha
          </h1>
        }
        subtitle="Linha do tempo narrativa das sessões de Angarden"
        headerRight={
          <ToolbarButton icon={<ArrowLeft className="h-4 w-4" />} onClick={voltar}>
            Voltar às crônicas
          </ToolbarButton>
        }
      >
        {isLoading ? (
          <LoadingState variant="text" label="Carregando crônica…" />
        ) : error ? (
          <ErrorState onRetry={reload} description={error} />
        ) : categorias.isLoading ? (
          <LoadingState variant="text" label="Carregando categorias…" />
        ) : categorias.error ? (
          <ErrorState onRetry={categorias.reload} description={categorias.error} />
        ) : !cronica ? (
          <EmptyState
            variant="plano"
            title="Crônica não encontrada"
            description="O relato pode ter sido removido ou não está disponível para a sua conta."
            action={<ToolbarButton icon={<ArrowLeft className="h-4 w-4" />} onClick={voltar}>Voltar às crônicas</ToolbarButton>}
          />
        ) : participantes.isLoading ? (
          <LoadingState variant="text" label="Carregando companhia…" />
        ) : participantes.error ? (
          <ErrorState onRetry={participantes.reload} description={participantes.error} />
        ) : (
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(200px,0.7fr)_minmax(320px,1.9fr)_minmax(200px,0.7fr)]">
            <ProgressoDaCronicaPanel cronica={cronica} podeGerir={podeGerir} onCronicaAlterada={reload} />
            <RegistroSelecionadoPanel
              cronica={cronica}
              participantes={participantes.participantes}
              acoes={
                <CronicaAcoesBar
                  cronica={cronica}
                  podeGerir={podeGerir}
                  abrirEdicao={formulario.abrirEdicao}
                  abrirCompartilhar={() => setCompartilhando(true)}
                  abrirExclusao={() => setExcluindo(true)}
                  onAlterada={reload}
                />
              }
            >
              <NotasDaCronicaPanel cronica={cronica} podeGerir={podeGerir} onCronicaAlterada={reload} />
            </RegistroSelecionadoPanel>
            <div className="min-w-0 space-y-4">
              <CapaDaSessaoPanel cronica={cronica} />
              <DestaquesDaCronicaPanel cronicaId={cronica.id} />
            </div>
          </div>
        )}
      </PageShell>

      <NovaCronicaModal
        isOpen={formulario.isCreateModalOpen}
        onClose={formulario.fecharFormulario}
        onSubmit={formulario.handleSubmit}
        form={formulario.form}
        onFormChange={formulario.updateForm}
        onCategoriaChange={formulario.setCategoriaId}
        onNotasVisiveisChange={formulario.setNotasVisiveis}
        categorias={categorias.categorias}
        editando={Boolean(formulario.cronicaEmEdicao)}
        cronica={formulario.cronicaEmEdicao}
        recemCriada={formulario.recemCriada}
        concluida={formulario.cronicaEmEdicao?.status === 'CONCLUIDA'}
        onCoverChange={formulario.handleCoverChange}
        publishMode={formulario.publishMode}
        onPublishModeChange={formulario.setPublishMode}
        isSaving={formulario.isSaving}
        saveError={formulario.saveError}
        onCronicaAlterada={reload}
      />

      {cronica && (
        <>
          <ExcluirCronicaModal
            isOpen={excluindo}
            onClose={() => setExcluindo(false)}
            cronica={cronica}
            onExcluida={() => navigate(ROUTES.cronicas, { replace: true })}
          />
          <CompartilharCronicaModal
            isOpen={compartilhando}
            onClose={() => setCompartilhando(false)}
            cronicaId={cronica.id}
          />
        </>
      )}
    </>
  );
};

export default CronicaDetalhePage;
