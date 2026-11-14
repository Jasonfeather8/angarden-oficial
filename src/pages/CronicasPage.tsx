import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, Plus, ScrollText } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { CapaDaSessaoPanel } from '@/components/cronicas/CapaDaSessaoPanel';
import { ChecklistDaCronicaPanel } from '@/components/cronicas/ChecklistDaCronicaPanel';
import { CompartilharCronicaModal } from '@/components/cronicas/CompartilharCronicaModal';
import { CronicaAcoesBar } from '@/components/cronicas/CronicaAcoesBar';
import { ExcluirCronicaModal } from '@/components/cronicas/ExcluirCronicaModal';
import { FiltroDeCategorias } from '@/components/cronicas/FiltroDeCategorias';
import type { FiltroDeCategoriasAtivo } from '@/components/cronicas/FiltroDeCategorias';
import { GerenciarCategoriasModal } from '@/components/cronicas/GerenciarCategoriasModal';
import { LinhaDoTempoPanel } from '@/components/cronicas/LinhaDoTempoPanel';
import { NotasDaCronicaPanel } from '@/components/cronicas/NotasDaCronicaPanel';
import { NovaCronicaModal } from '@/components/cronicas/NovaCronicaModal';
import { ParticipantesDaCronicaPanel } from '@/components/cronicas/ParticipantesDaCronicaPanel';
import { RecompensasDaCronicaPanel } from '@/components/cronicas/RecompensasDaCronicaPanel';
import { RegistroSelecionadoPanel } from '@/components/cronicas/RegistroSelecionadoPanel';
import { useCategoriasDaCronica } from '@/components/cronicas/useCategoriasDaCronica';
import { useCronicaForm } from '@/components/cronicas/useCronicaForm';
import { useCronicas } from '@/components/cronicas/useCronicas';
import { useObjetivosDaCronica } from '@/components/cronicas/useObjetivosDaCronica';
import { useParticipantesDaCronica } from '@/components/cronicas/useParticipantesDaCronica';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { ToolbarButton } from '@/components/ui/ToolbarButton';
import { useAuthorization } from '@/hooks/useAuthorization';

/**
 * Crônicas: linha do tempo, relato em leitura, companhia, checklist, recompensas
 * e as notas do Mestre. Cada crônica é gerida apenas pelo Mestre que a criou.
 */
export const CronicasPage: React.FC = () => {
  const { isAdmin, isMestre, tenantId, userId } = useAuthorization();
  const { cronicas, selecionada, selecionar, isLoading, error, reload } = useCronicas(tenantId);
  const categorias = useCategoriasDaCronica(tenantId);
  const [, setSearchParams] = useSearchParams();

  const [categoriaAtiva, setCategoriaAtiva] = useState<FiltroDeCategoriasAtivo>('todas');
  const [gerenciandoCategorias, setGerenciandoCategorias] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);

  const nomesDeCategoria = useMemo(
    () => Object.fromEntries(categorias.categorias.map((categoria) => [categoria.id, categoria.nome])),
    [categorias.categorias],
  );

  const contagens = useMemo(
    () =>
      cronicas.reduce<Record<string, number>>((todas, cronica) => {
        const chave = cronica.categoriaId ?? 'sem';
        todas[chave] = (todas[chave] ?? 0) + 1;
        return todas;
      }, {}),
    [cronicas],
  );

  const filtradas = useMemo(
    () =>
      cronicas.filter((cronica) =>
        categoriaAtiva === 'todas'
          ? true
          : categoriaAtiva === 'sem'
            ? !cronica.categoriaId
            : cronica.categoriaId === categoriaAtiva,
      ),
    [cronicas, categoriaAtiva],
  );

  const emLeitura = filtradas.find((cronica) => cronica.id === selecionada?.id) ?? filtradas[0];
  const podeGerir = Boolean(emLeitura && (isAdmin || emLeitura.criadaPor === userId));

  const formulario = useCronicaForm({
    onSalva: (cronica) => {
      reload();
      selecionar(cronica.id);
    },
  });

  const participantes = useParticipantesDaCronica(emLeitura?.id ?? null);
  const objetivos = useObjetivosDaCronica(emLeitura?.id ?? null);
  const temChecklist = objetivos.objetivos.length > 0;

  const selecionarNaLista = (id: string) => {
    selecionar(id);
    setCategoriaAtiva('todas');
  };

  const aposExcluir = () => {
    setSearchParams({}, { replace: true });
    reload();
  };

  // Só o Mestre cria crônicas: a crônica pertence a um cliente, e o
  // administrador da plataforma não tem `tenant_id` para vincular.
  const podeCriar = isMestre;

  return (
    <>
      <PageShell
        id="page-cronicas"
        variant="padrao"
        title={
          <h1 className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-[#a88d61]" aria-hidden="true" />
            Crônicas
          </h1>
        }
        subtitle="Relatos, objetivos, recompensas e a companhia da mesa"
        headerRight={
          <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
            <div className="hidden items-center gap-1.5 border border-[#5a4225] bg-[#1b120b] px-2.5 py-1 font-cinzel text-[10px] uppercase tracking-wider text-[#b89558] sm:flex">
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              {cronicas.length} {cronicas.length === 1 ? 'registro' : 'registros'}
            </div>
            {podeCriar && (
              <ToolbarButton
                id="btn-nova-cronica"
                variant="primary"
                icon={<Plus className="h-4 w-4" />}
                onClick={formulario.abrirCriacao}
              >
                Nova Crônica
              </ToolbarButton>
            )}
          </div>
        }
      >
        {isLoading ? (
          <LoadingState variant="text" label="Carregando crônicas…" />
        ) : error ? (
          <ErrorState onRetry={reload} description={error} />
        ) : categorias.isLoading ? (
          <LoadingState variant="text" label="Carregando categorias…" />
        ) : categorias.error ? (
          <ErrorState onRetry={categorias.reload} description={categorias.error} />
        ) : cronicas.length === 0 ? (
          <EmptyState
            variant="plano"
            title="Nenhuma crônica registrada"
            description={
              podeCriar
                ? 'Registre o primeiro relato usando o botão “Nova Crônica” acima.'
                : 'Assim que uma crônica for compartilhada com você, ela aparecerá aqui.'
            }
          />
        ) : (
          <>
            <FiltroDeCategorias
              categorias={categorias.categorias}
              ativo={categoriaAtiva}
              contagens={contagens}
              onSelecionar={setCategoriaAtiva}
              onGerir={podeGerir ? () => setGerenciandoCategorias(true) : undefined}
            />

            {!emLeitura ? (
              <EmptyState
                variant="plano"
                title="Nenhuma crônica nesta categoria"
                description="Escolha outra categoria para continuar a leitura."
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(220px,0.85fr)_minmax(300px,1.35fr)_minmax(220px,0.8fr)]">
                  <LinhaDoTempoPanel
                    cronicas={filtradas}
                    cronicaSelecionadaId={emLeitura.id}
                    onSelecionar={selecionarNaLista}
                    nomesDeCategoria={nomesDeCategoria}
                  />
                  <RegistroSelecionadoPanel
                    key={`registro-${emLeitura.id}`}
                    cronica={emLeitura}
                    participantes={participantes.participantes}
                    nomesDeCategoria={nomesDeCategoria}
                    acoes={
                      <CronicaAcoesBar
                        cronica={emLeitura}
                        podeGerir={podeGerir}
                        abrirEdicao={formulario.abrirEdicao}
                        abrirCompartilhar={() => setCompartilhando(true)}
                        abrirExclusao={() => setExcluindo(true)}
                        onAlterada={reload}
                      />
                    }
                  />
                  <CapaDaSessaoPanel cronica={emLeitura} />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <ChecklistDaCronicaPanel
                    key={`checklist-${emLeitura.id}`}
                    cronica={emLeitura}
                    podeGerir={podeGerir}
                    onCronicaAlterada={reload}
                  />
                  <ParticipantesDaCronicaPanel
                    key={`companhia-${emLeitura.id}`}
                    cronica={emLeitura}
                    podeGerir={podeGerir}
                    userId={userId}
                    onAlterados={participantes.reload}
                  />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <RecompensasDaCronicaPanel
                    key={`recompensas-${emLeitura.id}`}
                    cronica={emLeitura}
                    podeGerir={podeGerir}
                  />
                  <NotasDaCronicaPanel
                    key={`notas-${emLeitura.id}`}
                    cronica={emLeitura}
                    podeGerir={podeGerir}
                    onCronicaAlterada={reload}
                  />
                </div>
              </>
            )}
          </>
        )}
      </PageShell>

      {podeCriar && (
        <NovaCronicaModal
          isOpen={formulario.isCreateModalOpen}
          onClose={formulario.fecharFormulario}
          onSubmit={formulario.handleSubmit}
          form={formulario.form}
          onFormChange={formulario.updateForm}
          onCategoriaChange={formulario.setCategoriaId}
          onNotasVisiveisChange={formulario.setNotasVisiveis}
          categorias={categorias.categorias}
          temChecklist={Boolean(formulario.cronicaEmEdicao) && temChecklist}
          editando={Boolean(formulario.cronicaEmEdicao)}
          concluida={formulario.cronicaEmEdicao?.status === 'CONCLUIDA'}
          onCoverChange={formulario.handleCoverChange}
          publishMode={formulario.publishMode}
          onPublishModeChange={formulario.setPublishMode}
          isSaving={formulario.isSaving}
          saveError={formulario.saveError}
        />
      )}

      <GerenciarCategoriasModal
        isOpen={gerenciandoCategorias}
        onClose={() => setGerenciandoCategorias(false)}
        categorias={categorias.categorias}
        onAlteradas={() => {
          categorias.reload();
          reload();
        }}
      />

      {emLeitura && (
        <>
          <ExcluirCronicaModal
            isOpen={excluindo}
            onClose={() => setExcluindo(false)}
            cronica={emLeitura}
            onExcluida={aposExcluir}
          />
          <CompartilharCronicaModal
            isOpen={compartilhando}
            onClose={() => setCompartilhando(false)}
            cronicaId={emLeitura.id}
          />
        </>
      )}
    </>
  );
};

export default CronicasPage;
