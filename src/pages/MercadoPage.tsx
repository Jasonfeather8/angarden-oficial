import React, { Suspense, useEffect } from 'react';
import { ShoppingBag, Package, Crown, Wand2 } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { InfiniteCategoryScroll } from '../components/InfiniteCategoryScroll';
import { ModalCriarMercadoria } from '../components/ModalCriarMercadoria';
import { ModalSelecionarComprador } from '../components/ModalSelecionarComprador';
import { ErrorState } from '../components/ui/ErrorState';
import { useAuthorization } from '../hooks/useAuthorization';
import { agendarEmOciosidade } from '../utils/idleCallback';
import { AbasDeSecao } from '../components/mercado/AbasDeSecao';
import { BarraDeSubcategorias } from '../components/mercado/BarraDeSubcategorias';
import { BarraDeBuscaDoCatalogo } from '../components/mercado/BarraDeBuscaDoCatalogo';
import { CabecalhoDoMercado } from '../components/mercado/CabecalhoDoMercado';
import { ListaDeItensDoMercado } from '../components/mercado/ListaDeItensDoMercado';
import { ModalDetalhesCompraLazy, preloadModalDetalhesCompra } from '../components/mercado/modalDetalhesCompraLazy';
import { useCatalogoDoMercado } from '../components/mercado/useCatalogoDoMercado';
import { useCompradorDoMercado } from '../components/mercado/useCompradorDoMercado';
import { useModaisDoMercado } from '../components/mercado/useModaisDoMercado';
import { CABECALHO_POR_SECAO } from '../components/mercado/catalogoMercado';

export const MercadoPage: React.FC = () => {
  // O catálogo global é gerido exclusivamente pelo Administrador.
  const { can, tenantId } = useAuthorization();
  const canManageCatalog = can.manageCatalog;

  const comprador = useCompradorDoMercado();
  const catalogo = useCatalogoDoMercado();
  const modais = useModaisDoMercado({ onCatalogoAlterado: catalogo.invalidarCatalogo });
  const cabecalho = CABECALHO_POR_SECAO[catalogo.secaoMercado];

  useEffect(() => agendarEmOciosidade(preloadModalDetalhesCompra), []);

  return (
    <>
      <PageShell id="page-mercado" variant="padrao" className="select-none"
        title={
          <h2 className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {catalogo.secaoMercado === 'epico' ? (
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#fbbf24] shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            ) : catalogo.secaoMercado === 'arcano' ? (
              <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#c084fc] shrink-0 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            ) : catalogo.secaoMercado === 'comum' ? (
              <Package className="w-5 h-5 sm:w-6 sm:h-6 text-[#c5a059] shrink-0" />
            ) : (
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#c5a059] shrink-0" />
            )}
            <span className="truncate">{cabecalho.titulo}</span>
          </h2>
        }
        subtitle={cabecalho.subtitulo}
        headerRight={
          <CabecalhoDoMercado
            tenantId={tenantId}
            fichaDoComprador={comprador.fichaDoComprador}
            loadingFicha={comprador.loadingFicha}
            saldoAtual={comprador.saldoAtual}
            canManageCatalog={canManageCatalog}
            onAbrirSelecaoComprador={modais.abrirSelecaoComprador}
            onCriarMercadoria={modais.abrirCriacao}
          />
        }
      >
        <div className="space-y-4 pt-1 sm:pt-2 pb-6 px-0.5 sm:px-3">
          
          {comprador.erroFicha && (
            <ErrorState
              title="Falha ao carregar a bolsa do comprador"
              description={comprador.erroFicha}
              className="py-6"
              onRetry={() => {
                void comprador.carregarListaPersonagens();
                void comprador.carregarFicha(comprador.personagemId);
              }}
            />
          )}

          {/* ========================================================================= */}
          {/* SELETORES DAS GRANDES ABAS DO MERCADO (ARSENAL, MERCADO COMUM, MERCADO ARCANO, ARSENAL ÉPICO) */}
          {/* ========================================================================= */}
          <AbasDeSecao secaoAtiva={catalogo.secaoMercado} onTrocarSecao={catalogo.trocarSecao} />

          {/* BARRA SUPERIOR DE CATEGORIAS: ROLAGEM INFINITA */}
          <div className="w-full">
            <InfiniteCategoryScroll
              tabs={catalogo.tabsConfig}
              activeId={catalogo.activeCategory}
              themeMode={catalogo.themeMode}
              onSelect={catalogo.selecionarCategoria}
            />
          </div>

          {/* ========================================================================= */}
          {/* SUBCATEGORIAS VISÍVEIS DA CATEGORIA SELECIONADA */}
          {/* ========================================================================= */}
          <BarraDeSubcategorias
            subcategorias={catalogo.subcategoriasAtuais}
            subcategoriaAtiva={catalogo.subcategoriaAtiva}
            rotuloCategoria={catalogo.categoriaAtivaInfo?.label}
            onSelecionar={catalogo.selecionarSubcategoria}
          />

          {/* BARRA DE PESQUISA & STATUS DO CATÁLOGO DA CATEGORIA */}
          <BarraDeBuscaDoCatalogo
            rotuloCategoria={catalogo.categoriaAtivaInfo?.label}
            subcategorias={catalogo.subcategoriasAtuais}
            subcategoriaAtiva={catalogo.subcategoriaAtiva}
            totalItens={catalogo.totalItens}
            buscandoItens={catalogo.buscandoItens}
            busca={catalogo.busca}
            onBuscaChange={catalogo.setBusca}
          />

          {/* LISTAGEM DE ITENS DA CATEGORIA */}
          <ListaDeItensDoMercado
            itens={catalogo.itens}
            carregandoItens={catalogo.carregandoItens}
            erroItens={catalogo.erroItens}
            erroConsulta={catalogo.erroConsulta}
            totalItens={catalogo.totalItens}
            rotuloCategoria={catalogo.categoriaAtivaInfo?.label}
            temPermissaoEpica={comprador.temPermissaoEpica}
            temPermissaoArcano={comprador.temPermissaoArcano}
            onAbrirDetalhes={modais.abrirDetalhes}
            onPreloadDetalhes={preloadModalDetalhesCompra}
            onRecarregar={catalogo.recarregarItens}
            page={catalogo.page}
            totalPaginas={catalogo.totalPaginas}
            pageSize={catalogo.pageSize}
            isPlaceholderData={catalogo.isPlaceholderData}
            onPaginaAnterior={catalogo.paginaAnterior}
            onProximaPagina={catalogo.proximaPagina}
          />

        </div>
      </PageShell>

      {/* ========================================================================= */}
      {/* TELA 3.1 - MODAL DE DETALHES E COMPRA DE ITEM */}
      {/* ========================================================================= */}
      {(modais.isModalOpen || modais.selectedItem) && (
        <Suspense fallback={null}>
          <ModalDetalhesCompraLazy
            isOpen={modais.isModalOpen}
            onClose={modais.fecharDetalhes}
            item={modais.selectedItem}
            saldoAtual={comprador.saldoAtual}
            cargaAtual={comprador.cargaAtual}
            nomePersonagemComprador={comprador.fichaDoComprador?.identidade?.nome_personagem}
            temPermissaoEpica={comprador.temPermissaoEpica}
            temPermissaoArcano={comprador.temPermissaoArcano}
            temPermissaoCompra={comprador.temPermissaoCompra}
            onConfirmarCompra={comprador.confirmarCompra}
            canManageCatalog={canManageCatalog}
            onEditar={modais.abrirEdicao}
            onExcluir={modais.excluirMercadoria}
          />
        </Suspense>
      )}

      {/* ========================================================================= */}
      {/* TELA 3.2 - MODAL DE CRIAR / EDITAR MERCADORIA (ADMINISTRADOR) */}
      {/* ========================================================================= */}
      <ModalCriarMercadoria
        isOpen={modais.isModalCriarOpen}
        onClose={modais.fecharCriacao}
        onVoltar={modais.voltarParaDetalhes}
        onItemCriado={modais.salvarMercadoria}
        itemParaEdicao={modais.itemParaEdicao}
      />

      {/* ========================================================================= */}
      {/* TELA 3.3 - MODAL DE SELEÇÃO DE COMPRADOR DA COMITIVA */}
      {/* ========================================================================= */}
      <ModalSelecionarComprador
        isOpen={modais.isModalCompradorOpen}
        onClose={modais.fecharSelecaoComprador}
        personagens={comprador.listaPersonagens}
        personagemSelecionadoId={comprador.personagemId}
        onSelecionar={comprador.selecionarComprador}
      />

    </>
  );
};

export default MercadoPage;
