import React, { useMemo, useState } from 'react';
import { FileText, Plus, ScrollText } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { CardCronica } from '@/components/cronicas/CardCronica';
import { FiltroDeCategorias } from '@/components/cronicas/FiltroDeCategorias';
import type { FiltroDeCategoriasAtivo } from '@/components/cronicas/FiltroDeCategorias';
import { GerenciarCategoriasModal } from '@/components/cronicas/GerenciarCategoriasModal';
import { NovaCronicaModal } from '@/components/cronicas/NovaCronicaModal';
import { useCategoriasDaCronica } from '@/components/cronicas/useCategoriasDaCronica';
import { useCronicaForm } from '@/components/cronicas/useCronicaForm';
import { useCronicas } from '@/components/cronicas/useCronicas';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { ToolbarButton } from '@/components/ui/ToolbarButton';
import { useAuthorization } from '@/hooks/useAuthorization';

/** Estante de crônicas, filtrável por categoria. */
export const CronicasPage: React.FC = () => {
  const { isMestre, tenantId } = useAuthorization();
  const { cronicas, isLoading, error, reload } = useCronicas(tenantId);
  const categorias = useCategoriasDaCronica(tenantId);
  const [categoriaAtiva, setCategoriaAtiva] = useState<FiltroDeCategoriasAtivo>('todas');
  const [gerenciandoCategorias, setGerenciandoCategorias] = useState(false);

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

  const formulario = useCronicaForm({ onSalva: () => reload() });

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
            {isMestre && (
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
              isMestre
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
              onGerir={isMestre ? () => setGerenciandoCategorias(true) : undefined}
            />
            {filtradas.length === 0 ? (
              <EmptyState
                variant="plano"
                title="Nenhuma crônica nesta categoria"
                description="Escolha outra categoria para continuar a leitura."
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtradas.map((cronica) => (
                  <CardCronica
                    key={cronica.id}
                    cronica={cronica}
                    nomeDaCategoria={nomesDeCategoria[cronica.categoriaId ?? '']}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </PageShell>

      {isMestre && (
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
    </>
  );
};

export default CronicasPage;
