import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, Scroll, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { CardMaterialBiblioteca } from '@/components/biblioteca/CardMaterialBiblioteca';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { ToolbarButton } from '@/components/ui/ToolbarButton';
import { CATEGORIAS_BIBLIOTECA, GRUPOS_BIBLIOTECA } from '@/config/biblioteca';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ROUTES } from '@/routes/paths';
import { carregarAcervoBiblioteca, chaveAcervoBiblioteca } from '@/services/bibliotecaQuery';
import { normalizarBusca, TAMANHO_MINIMO_BUSCA } from '@/utils/normalizarBusca';
import type { ItemBiblioteca } from '@/types';

// Os leitores só baixam quando um material é aberto: o pdf.js é pesado e não
// pode entrar no trecho da rota.
const LeitorPdf = React.lazy(() => import('@/components/biblioteca/LeitorPdf'));
const LeitorPergaminho = React.lazy(() => import('@/components/biblioteca/LeitorPergaminho'));

/** Espera antes de consultar o servidor, para não disparar a cada tecla. */
const ESPERA_BUSCA_MS = 300;

/**
 * Estante da Biblioteca. O acervo é catálogo global da plataforma: a RLS
 * entrega tudo o que a conta pode ver (o Administrador também recebe o que está
 * oculto) e o filtro de categoria e a busca são resolvidos no banco, sobre a
 * coluna normalizada `busca`. O agrupamento por seção é só apresentação.
 */
export const BibliotecaPage: React.FC = () => {
  const { role, can } = useAuthorization();
  const navigate = useNavigate();

  const [termo, setTermo] = useState('');
  const [termoDebounced, setTermoDebounced] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [materialAberto, setMaterialAberto] = useState<ItemBiblioteca | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => setTermoDebounced(termo), ESPERA_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [termo]);

  const termoNormalizado = normalizarBusca(termoDebounced);
  const filtroAtivo = categoriaFiltro !== null || termoNormalizado.length >= TAMANHO_MINIMO_BUSCA;

  const parametros = useMemo(
    () => ({ papel: role, categoria: categoriaFiltro, termo: termoNormalizado }),
    [role, categoriaFiltro, termoNormalizado],
  );

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: chaveAcervoBiblioteca(parametros),
    queryFn: () => carregarAcervoBiblioteca(parametros),
    placeholderData: keepPreviousData,
    // Sem validade: a estante pinta do cache e revalida em segundo plano a cada
    // visita, para uma publicação recente do Administrador aparecer de imediato.
    staleTime: 0,
  });

  const itens = data ?? [];

  const gruposVisiveis = useMemo(
    () =>
      GRUPOS_BIBLIOTECA.map((grupo) => ({
        grupo,
        itens: itens.filter((item) =>
          grupo.categorias.some((categoria) => categoria.id === item.categoria),
        ),
      })).filter(({ itens: itensDoGrupo }) => itensDoGrupo.length > 0),
    [itens],
  );

  const limparFiltros = () => {
    setTermo('');
    setCategoriaFiltro(null);
  };

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
          <div className="flex flex-col gap-3 border-b border-[#3a2c1d] pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-cinzel text-xs font-bold uppercase tracking-[0.18em] text-[#d1a85a]">
                Acervo de Angarden
              </p>
              <p className="mt-1 max-w-2xl font-serif text-sm text-[#a99c84]">
                Escolha um tomo para consultar suas regras e referências durante a aventura.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-serif text-xs italic text-[#80613d]">
                {filtroAtivo
                  ? `${itens.length} volume(s) encontrado(s)`
                  : `${itens.length} volume(s) catalogado(s)`}
              </span>
              {isFetching && !isLoading && (
                <span className="font-serif text-xs italic text-[#d1a85a]" role="status" aria-live="polite">
                  Buscando…
                </span>
              )}
              {can.manageLibrary && (
                <ToolbarButton
                  icon={<Scroll className="h-4 w-4" />}
                  onClick={() => navigate(ROUTES.admin.biblioteca)}
                >
                  Gerenciar acervo
                </ToolbarButton>
              )}
            </div>
          </div>

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
              <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center border border-[#4b3823] bg-[#0e0a07]">
                    <label htmlFor="busca-acervo" className="sr-only">
                      Buscar no acervo
                    </label>
                    <Search className="m-2 h-4 w-4 shrink-0 text-[#8c6b41]" aria-hidden="true" />
                    <input
                      id="busca-acervo"
                      type="search"
                      value={termo}
                      onChange={(evento) => setTermo(evento.target.value)}
                      placeholder="Buscar por título, subtítulo ou descrição"
                      className="min-w-0 flex-1 bg-transparent px-1 py-2 font-serif text-sm text-[#e6ddc5] placeholder:text-[#756044] focus:outline-none"
                    />
                    {termo && (
                      <button
                        type="button"
                        onClick={() => setTermo('')}
                        title="Limpar busca"
                        aria-label="Limpar busca"
                        className="border-l border-[#4b3823] px-2 py-2 text-[#9e8052] transition-colors hover:bg-[#2d1e12] hover:text-[#e0bd71] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCategoriaFiltro(null)}
                    aria-pressed={categoriaFiltro === null}
                    className={`border px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] ${
                      categoriaFiltro === null
                        ? 'border-[#a88d61] bg-[#2a1d10] text-[#f3ebd3]'
                        : 'border-[#4b3823] bg-[#0e0a07] text-[#a88d61] hover:border-[#8c6b41] hover:text-[#e6ddc5]'
                    }`}
                  >
                    Todo o acervo
                  </button>
                  {CATEGORIAS_BIBLIOTECA.map((categoria) => (
                    <button
                      key={categoria.id}
                      type="button"
                      onClick={() => setCategoriaFiltro(categoria.id)}
                      aria-pressed={categoriaFiltro === categoria.id}
                      className={`border px-3 py-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] ${
                        categoriaFiltro === categoria.id
                          ? 'border-[#a88d61] bg-[#2a1d10] text-[#f3ebd3]'
                          : 'border-[#4b3823] bg-[#0e0a07] text-[#a88d61] hover:border-[#8c6b41] hover:text-[#e6ddc5]'
                      }`}
                    >
                      {categoria.label}
                    </button>
                  ))}
                </div>
              </div>

              {gruposVisiveis.length === 0 ? (
                <EmptyState
                  variant="plano"
                  title="Nenhum material encontrado"
                  description="Ajuste a busca ou escolha outra categoria para ver o restante do acervo."
                  action={
                    <button
                      type="button"
                      onClick={limparFiltros}
                      className="border border-[#8c6b41] bg-[#241a11] px-3 py-2 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#d8bd83] transition-colors hover:border-[#d1a85a] hover:text-[#f0d79b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a]"
                    >
                      Limpar filtros
                    </button>
                  }
                />
              ) : (
                gruposVisiveis.map(({ grupo, itens: itensDoGrupo }) => (
                  <section key={grupo.id} aria-labelledby={`estante-${grupo.id}`} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3
                        id={`estante-${grupo.id}`}
                        className="font-cinzel text-sm font-bold uppercase tracking-[0.16em] text-[#d1a85a]"
                      >
                        {grupo.label}
                      </h3>
                      <span className="h-px flex-1 bg-[#3a2c1d]" aria-hidden="true" />
                      <span className="font-serif text-xs italic text-[#80613d]">
                        {itensDoGrupo.length} volume(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {itensDoGrupo.map((item) => (
                        <CardMaterialBiblioteca
                          key={item.id}
                          item={item}
                          onAbrir={() => setMaterialAberto(item)}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </>
          )}
        </div>
      </PageShell>

      {materialAberto && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0906]/[.98]">
              <LoadingState label="Abrindo o leitor…" />
            </div>
          }
        >
          {materialAberto.tipo === 'pdf' ? (
            <LeitorPdf item={materialAberto} onFechar={() => setMaterialAberto(null)} />
          ) : (
            <LeitorPergaminho item={materialAberto} onFechar={() => setMaterialAberto(null)} />
          )}
        </Suspense>
      )}
    </>
  );
};

export default BibliotecaPage;
