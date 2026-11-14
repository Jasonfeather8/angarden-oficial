import React from 'react';
import { BookOpen, Lock } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { ModalSelecionarComprador } from '../components/ModalSelecionarComprador';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';
import { SpellDetailsModal as SharedSpellDetailsModal } from '../components/GrimorioSpellComponents';
import { useAuthorization } from '../hooks/useAuthorization';
import { useOtimizarImagensGrimorio } from '../hooks/useOtimizarImagensGrimorio';
import { AvisoDeImagensPesadas } from '../components/grimorio/AvisoDeImagensPesadas';
import { BarraDeBuscaDeMagias } from '../components/grimorio/BarraDeBuscaDeMagias';
import { BarraDeNavegacao } from '../components/grimorio/BarraDeNavegacao';
import { BookView } from '../components/grimorio/BookView';
import { CabecalhoDoGrimorio } from '../components/grimorio/CabecalhoDoGrimorio';
import { ElementTreeView } from '../components/grimorio/ElementTreeView';
import { MagiaFormModal } from '../components/grimorio/MagiaFormModal';
import { MentalizacaoTreeView } from '../components/grimorio/MentalizacaoTreeView';
import { ResultadosDaBusca } from '../components/grimorio/ResultadosDaBusca';
import { SchoolsView } from '../components/grimorio/SchoolsView';
import { TreeView } from '../components/grimorio/TreeView';
import { useBloqueiosDoGrimorio } from '../components/grimorio/useBloqueiosDoGrimorio';
import { useBuscaDeMagias } from '../components/grimorio/useBuscaDeMagias';
import { useDetalhesDaMagia } from '../components/grimorio/useDetalhesDaMagia';
import { useMagiaForm } from '../components/grimorio/useMagiaForm';
import { useMagiasAprendidas } from '../components/grimorio/useMagiasAprendidas';
import { useMagiasDoGrimorio } from '../components/grimorio/useMagiasDoGrimorio';
import { useNavegacaoDoGrimorio } from '../components/grimorio/useNavegacaoDoGrimorio';
import { usePersonagemDoGrimorio } from '../components/grimorio/usePersonagemDoGrimorio';

export const GrimorioPage: React.FC = () => {
  const { can, tenantId } = useAuthorization();
  const canManageCatalog = can.manageCatalog;
  const canManageVisibility = can.manageSpellVisibility;
  const podeVerBloqueado = canManageVisibility;

  const detalhes = useDetalhesDaMagia();
  const bloqueios = useBloqueiosDoGrimorio(tenantId);
  const { imagensPesadas, bytesPesados, processando, processadas, erroOtimizacao, otimizarImagens } = useOtimizarImagensGrimorio(canManageCatalog);
  const personagem = usePersonagemDoGrimorio(tenantId);
  const aprendidas = useMagiasAprendidas(personagem.personagemId);
  const navegacao = useNavegacaoDoGrimorio({
    escolaBloqueada: bloqueios.escolaBloqueada,
    volumeBloqueado: bloqueios.volumeBloqueado,
    podeVerBloqueado,
  });
  const busca = useBuscaDeMagias({ onResetPagina: navegacao.irParaPrimeiroFolio });
  const magias = useMagiasDoGrimorio({
    volumeId: navegacao.selectedVolume?.id,
    termoBusca: busca.termoBusca,
    buscandoMagias: busca.buscandoMagias,
    folioPage: navegacao.folioPage,
    canManageCatalog,
    canManageVisibility,
    onMagiaExcluida: detalhes.limparSeMagiaAtual,
  });
  const formulario = useMagiaForm({
    canManageCatalog,
    school: navegacao.school,
    selectedVolume: navegacao.selectedVolume,
    abrirTomo: navegacao.abrirTomo,
    fecharDetalhes: detalhes.fecharDetalhes,
    executarMutacaoGrimorio: magias.executarMutacaoGrimorio,
  });

  // Ações compartilhadas por todos os cards de magia da tela.
  const acoesDaMagia = {
    learnedIds: aprendidas.learnedIds,
    hiddenSpellIds: magias.hiddenSpellIds,
    canManageCatalog,
    canManageVisibility,
    onOpenSpell: detalhes.abrirDetalhes,
    onToggleLearned: aprendidas.toggleLearned,
    onEdit: formulario.abrirEdicao,
    onToggleHidden: magias.toggleHidden,
    onDelete: magias.deleteSpell,
  };

  const magiaSelecionada = detalhes.selectedSpell;

  return (
      <PageShell id="page-grimorio" variant="padrao"
        title={<h2 className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-[#a88d61]" /> Grimório de Magias</h2>}
        subtitle="Escolas arcanas, níveis de conjuração e rituais do sistema"
        headerRight={
          <CabecalhoDoGrimorio
            tenantId={tenantId}
            selectedPersonagem={personagem.selectedPersonagem}
            isLoadingPersonagens={personagem.isLoadingPersonagens}
            exibirRotuloPersonagemAtivo={navegacao.view !== 'schools'}
            canManageCatalog={canManageCatalog}
            onAbrirSelecaoPersonagem={personagem.abrirSelecao}
            onCriarMagia={formulario.abrirCriacao}
          />
        }
      >
        <div className="space-y-6">
          <BarraDeBuscaDeMagias
            busca={busca.busca}
            onBuscaChange={busca.atualizarBusca}
            onLimpar={busca.limparBusca}
          />
          {canManageCatalog && imagensPesadas.length > 0 && (
            <AvisoDeImagensPesadas
              total={imagensPesadas.length}
              bytesPesados={bytesPesados}
              processando={processando}
              processadas={processadas}
              erroOtimizacao={erroOtimizacao}
              onOtimizar={() => void otimizarImagens()}
            />
          )}
          {magias.erroGrimorio && (
            <ErrorState
              title="Falha ao carregar o grimório"
              description={magias.erroGrimorio}
              className="py-6"
              onRetry={() => {
                personagem.reloadPersonagens();
                magias.limparErroMutacao();
                void magias.recarregarGrimorio();
              }}
            />
          )}
          {!magias.isLoadingGrimorio && !magias.erroGrimorio && tenantId && !personagem.isLoadingPersonagens && personagem.erroPersonagens && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#c4b9a3]" role="status">
              <span>Não foi possível carregar a lista de personagens: {personagem.erroPersonagens}</span>
              <button type="button" onClick={personagem.reloadPersonagens} className="text-[#d6b56a] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]">
                Tentar novamente
              </button>
            </div>
          )}
          {!magias.isLoadingGrimorio && !magias.erroGrimorio && tenantId && !personagem.isLoadingPersonagens && !personagem.erroPersonagens && personagem.listaPersonagens.length === 0 && (
            <p className="text-xs text-[#8c6b41]" role="status">
              Nenhum personagem encontrado. Crie um personagem na aba Personagens para vincular as magias aprendidas.
            </p>
          )}
          {navegacao.bloqueioAviso && <p role="status" className="border-l-2 border-[#a88d61] bg-[#21170e] px-3 py-2 text-xs text-[#c4b9a3]">{navegacao.bloqueioAviso}</p>}

          {navegacao.view !== 'schools' && (
            <BarraDeNavegacao
              schoolName={navegacao.school.name}
              branch={navegacao.branch}
              view={navegacao.view}
              volumeTitle={navegacao.selectedVolume.title}
              onVoltar={navegacao.goBack}
            />
          )}

          {!busca.buscandoMagias && navegacao.view === 'schools' && <SchoolsView onChoose={navegacao.chooseSchool} bloqueadas={bloqueios.escolasBloqueadas} podeAbrirBloqueada={podeVerBloqueado} onCreate={canManageCatalog ? formulario.abrirCriacao : undefined} />}
          {!busca.buscandoMagias && navegacao.view === 'element-tree' && <ElementTreeView onChooseElement={navegacao.chooseElement} bloqueadas={navegacao.elementosBloqueados} podeAbrirBloqueada={podeVerBloqueado} />}
          {!busca.buscandoMagias && navegacao.view === 'mental-tree' && <MentalizacaoTreeView onChooseSubcategory={navegacao.chooseMentalizacaoSubcategory} bloqueadas={navegacao.mentalizacoesBloqueadas} podeAbrirBloqueada={podeVerBloqueado} />}
          {!busca.buscandoMagias && navegacao.view === 'tree' && <TreeView school={navegacao.school} volumes={navegacao.volumes} escolaEstaBloqueada={bloqueios.escolaBloqueada(navegacao.school.id)} escolasBloqueadas={bloqueios.escolasBloqueadas} volumesBloqueados={bloqueios.volumesBloqueados} podeAbrirBloqueada={podeVerBloqueado} onChooseVolume={navegacao.chooseVolume} />}
          {!busca.buscandoMagias && navegacao.view === 'book' && !podeVerBloqueado && bloqueios.volumeBloqueado(navegacao.selectedVolume.id) ? (
            <EmptyState
              variant="plano"
              icon={<Lock className="h-8 w-8" aria-hidden="true" />}
              title="Volume selado pelo Mestre"
              description="O conteúdo deste tomo está selado para esta mesa."
            />
          ) : !busca.buscandoMagias && navegacao.view === 'book' && (
            <BookView
              carregando={magias.isLoadingGrimorio}
              school={navegacao.school}
              volume={navegacao.selectedVolume}
              spells={magias.bookSpells}
              allBookSpells={magias.totalMagias}
              page={navegacao.folioPage}
              totalPages={magias.totalFolios}
              onPageChange={navegacao.irParaFolio}
              acoes={acoesDaMagia}
            />
          )}
          {busca.buscandoMagias && (
            <ResultadosDaBusca
              carregando={magias.isLoadingGrimorio}
              termoBusca={busca.termoBusca}
              totalMagias={magias.totalMagias}
              spells={magias.bookSpells}
              folioPage={navegacao.folioPage}
              totalFolios={magias.totalFolios}
              onPageChange={navegacao.irParaFolio}
              onLimparBusca={busca.limparBusca}
              acoes={acoesDaMagia}
            />
          )}
        </div>

      {magiaSelecionada && (canManageVisibility || !magias.hiddenSpellIds.includes(magiaSelecionada.id)) && (
        <SharedSpellDetailsModal
          spell={magiaSelecionada}
          learned={aprendidas.learnedIds.includes(magiaSelecionada.id)}
          canManage={canManageCatalog}
          canToggleHidden={canManageVisibility}
          hidden={magias.hiddenSpellIds.includes(magiaSelecionada.id)}
          onClose={detalhes.fecharDetalhes}
          onToggleLearned={() => aprendidas.toggleLearned(magiaSelecionada.id)}
          onEdit={() => formulario.abrirEdicao(magiaSelecionada)}
          onToggleHidden={() => magias.toggleHidden(magiaSelecionada.id)}
          onDelete={() => magias.deleteSpell(magiaSelecionada)}
        />
      )}

      <MagiaFormModal
        isOpen={formulario.isCreateOpen}
        isEditing={formulario.isEditing}
        form={formulario.newSpellForm}
        onFormChange={formulario.setNewSpellForm}
        onSubmit={formulario.handleSpellSubmit}
        onClose={formulario.fecharFormulario}
        enviandoImagem={formulario.enviandoImagem}
        erroUploadImagem={formulario.erroUploadImagem}
        onImageChange={formulario.handleImageChange}
        formSchool={formulario.formSchool}
        formSubcategoryCatalog={formulario.formSubcategoryCatalog}
        formDestinationSchool={formulario.formDestinationSchool}
        formVolume={formulario.formVolume}
        volumeTitle={navegacao.selectedVolume?.title ?? ''}
      />

      <ModalSelecionarComprador
        isOpen={personagem.selecaoAberta}
        onClose={personagem.fecharSelecao}
        personagens={personagem.listaPersonagens}
        personagemSelecionadoId={personagem.personagemId}
        onSelecionar={personagem.selectCharacter}
      />
      </PageShell>
  );
};

export default GrimorioPage;
