import React from 'react';
import { Scroll } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { CabecalhoDaBiblioteca } from '@/components/biblioteca/CabecalhoDaBiblioteca';
import { EstantesDaBiblioteca } from '@/components/biblioteca/EstantesDaBiblioteca';
import { FiltrosDaBiblioteca } from '@/components/biblioteca/FiltrosDaBiblioteca';
import { LeitorDeMaterial } from '@/components/biblioteca/LeitorDeMaterial';
import { useAcervoBiblioteca } from '@/components/biblioteca/useAcervoBiblioteca';
import { useFiltrosDaBiblioteca } from '@/components/biblioteca/useFiltrosDaBiblioteca';
import { useLeitorDaBiblioteca } from '@/components/biblioteca/useLeitorDaBiblioteca';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROUTES } from '@/routes/paths';

/**
 * Estante da Biblioteca. O acervo é catálogo global da plataforma e a leitura
 * do catálogo, a busca e o filtro de categoria ficam em `useAcervoBiblioteca`;
 * aqui só se compõe a faixa de resumo, os filtros, as estantes e o leitor.
 */
export const BibliotecaPage: React.FC = () => {
  const { role, can } = useAuthorization();
  const navigate = useNavigate();

  const {
    termo,
    setTermo,
    categoriaFiltro,
    setCategoriaFiltro,
    termoNormalizado,
    filtroAtivo,
    limparTermo,
    limparFiltros,
  } = useFiltrosDaBiblioteca();

  const { itens, estantes, isLoading, isFetching, isError, error, refetch } = useAcervoBiblioteca({
    papel: role,
    categoria: categoriaFiltro,
    termo: termoNormalizado,
  });

  const { materialAberto, abrirMaterial, fecharMaterial } = useLeitorDaBiblioteca();

  return (
    <>
      <PageShell
        id="page-biblioteca"
        variant="padrao"
        title={
          <h2 className="flex items-center gap-2">
            <Scroll className="h-5 w-5 text-[#a88d61]" />
            Biblioteca
          </h2>
        }
        subtitle="Manuais de regras, suplementos e livros de Angarden"
      >
        <div className="space-y-6">
          <CabecalhoDaBiblioteca
            total={itens.length}
            filtroAtivo={filtroAtivo}
            isFetching={isFetching}
            isLoading={isLoading}
            podeGerenciar={can.manageLibrary}
            onGerenciar={() => navigate(ROUTES.admin.biblioteca)}
          />

          {isLoading ? (
            <LoadingState variant="cards" label="Abrindo o acervo…" />
          ) : isError ? (
            <ErrorState
              description={error instanceof Error ? error.message : 'Não foi possível carregar o acervo.'}
              onRetry={() => void refetch()}
            />
          ) : itens.length === 0 && !filtroAtivo ? (
            <EmptyState
              variant="plano"
              title="Acervo vazio"
              description="Nenhum manual foi catalogado no acervo até o momento."
            />
          ) : (
            <>
              <FiltrosDaBiblioteca
                termo={termo}
                categoriaFiltro={categoriaFiltro}
                onTermoChange={setTermo}
                onLimparTermo={limparTermo}
                onCategoriaChange={setCategoriaFiltro}
              />
              <EstantesDaBiblioteca
                estantes={estantes}
                onAbrir={abrirMaterial}
                onLimparFiltros={limparFiltros}
              />
            </>
          )}
        </div>
      </PageShell>

      <LeitorDeMaterial item={materialAberto} onFechar={fecharMaterial} />
    </>
  );
};

export default BibliotecaPage;
