import React from 'react';
import { FileText, Plus, ScrollText } from 'lucide-react';
import { GothicButton } from '@/components/GothicButton';
import { PageShell } from '@/components/PageShell';
import { CapaDaSessaoPanel } from '@/components/cronicas/CapaDaSessaoPanel';
import { LinhaDoTempoPanel } from '@/components/cronicas/LinhaDoTempoPanel';
import { NovaCronicaModal } from '@/components/cronicas/NovaCronicaModal';
import { RegistroSelecionadoPanel } from '@/components/cronicas/RegistroSelecionadoPanel';
import { useCronicaForm } from '@/components/cronicas/useCronicaForm';
import { useCronicasDaCampanha } from '@/components/cronicas/useCronicasDaCampanha';
import { usePersonagensDaCronica } from '@/components/cronicas/usePersonagensDaCronica';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { useAuthorization } from '@/hooks/useAuthorization';

/**
 * Crônicas da campanha: a linha do tempo das sessões, o relato selecionado e a
 * capa da sessão. Os dados e a seleção vêm de `useCronicasDaCampanha`, o
 * formulário de `useCronicaForm` e as presenças de `usePersonagensDaCronica`;
 * aqui só se compõe a tela.
 */
export const CronicasPage: React.FC = () => {
  const { isAdmin, isMestre, tenantId } = useAuthorization();
  const isMaster = isAdmin || isMestre;

  const { cronicas, selecionada, selecionar, isLoading, error, reload } = useCronicasDaCampanha(tenantId);

  const formulario = useCronicaForm({
    onCriada: (cronica) => {
      reload();
      selecionar(cronica.id);
    },
  });

  const { personagens, isLoadingPersonagens, erroPersonagens, reloadPersonagens } =
    usePersonagensDaCronica(tenantId, formulario.isCreateModalOpen);

  return (
    <>
      <PageShell id="page-cronicas" variant="padrao"
        title={
          <h2 className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-[#a88d61]" />
            Crônicas da Campanha
          </h2>
        }
        subtitle="Linha do tempo narrativa das sessões de Angarden"
        headerRight={
          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
            <div className="hidden items-center gap-1.5 border border-[#5a4225] bg-[#1b120b] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[#b89558] sm:flex">
              <FileText className="h-3.5 w-3.5" />
              {cronicas.length} registros
            </div>
            {isMaster && (
              <GothicButton
                id="btn-nova-cronica"
                type="button"
                size="sm"
                width={170}
                height={38}
                icon={<Plus className="h-4 w-4" />}
                onClick={formulario.abrirCriacao}
                aria-label="Criar nova crônica"
              >
                Nova Crônica
              </GothicButton>
            )}
          </div>
        }
      >
        {isLoading ? (
          <LoadingState variant="text" label="Carregando crônicas…" />
        ) : error ? (
          <ErrorState onRetry={reload} description={error} />
        ) : cronicas.length === 0 || !selecionada ? (
          <EmptyState
            variant="plano"
            title="Nenhuma crônica registrada"
            description={
              isMaster
                ? 'Registre o primeiro relato usando o botão “Nova Crônica” acima.'
                : 'Assim que a primeira sessão for narrada, o relato aparecerá aqui.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(220px,0.85fr)_minmax(300px,1.35fr)_minmax(220px,0.8fr)]">
            <LinhaDoTempoPanel
              cronicas={cronicas}
              cronicaSelecionadaId={selecionada.id}
              onSelecionar={selecionar}
            />
            <RegistroSelecionadoPanel cronica={selecionada} />
            <CapaDaSessaoPanel cronica={selecionada} />
          </div>
        )}
      </PageShell>

      {isMaster && (
        <NovaCronicaModal
          isOpen={formulario.isCreateModalOpen}
          onClose={formulario.fecharFormulario}
          onSubmit={formulario.handleSubmit}
          form={formulario.form}
          onFormChange={formulario.updateForm}
          onToggleCharacter={formulario.toggleCharacter}
          onCoverChange={formulario.handleCoverChange}
          publishMode={formulario.publishMode}
          onPublishModeChange={formulario.setPublishMode}
          isSaving={formulario.isSaving}
          saveError={formulario.saveError}
          personagens={personagens}
          isLoadingPersonagens={isLoadingPersonagens}
          erroPersonagens={erroPersonagens}
          onReloadPersonagens={reloadPersonagens}
        />
      )}
    </>
  );
};

export default CronicasPage;
