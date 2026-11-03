import React, { useCallback, useEffect, useRef, useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Check,
  CircleDot,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  TreePine,
  WandSparkles,
  X,
  Search,
  User,
} from 'lucide-react';
import { MedievalFrame } from '../components/MedievalFrame';
import { Modal } from '../components/Modal';
import { ModalSelecionarComprador, PersonagemResumo } from '../components/ModalSelecionarComprador';
import { GothicButton } from '../components/GothicButton';
import { EmptyState } from '../components/ui/EmptyState';
import {
  getSchoolVolumes,
  grimorioAdditionalSchools,
  grimorioCosmicoSchools,
  grimorioElementos,
  grimorioExotericoSchools,
  grimorioMaiorSchools,
  grimorioMentalizacao,
  GRIMORIO_ELEMENT_TREE,
  grimorioSchools,
  grimorioVolumes,
  GRIMORIO_LEVELS,
  GrimorioLevel,
  GrimorioSpell,
} from '../mocks/grimorio';
import {
  getLearnedSpellIds,
  setLearnedSpell,
  listarMagiasDoVolume,
  buscarMagias,
  criarMagia,
  atualizarMagia,
  alternarOculta,
  excluirMagia,
} from '../services/grimorioService';
import { fichaService } from '../services/fichaService';
import { withTimeout } from '../utils/withTimeout';
import { normalizarBusca, TAMANHO_MINIMO_BUSCA } from '../utils/normalizarBusca';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingState } from '../components/ui/Skeleton';
import { useAuthorization } from '../hooks/useAuthorization';
import { useOtimizarImagensGrimorio } from '../hooks/useOtimizarImagensGrimorio';
import { enviarImagem } from '../services/mediaService';
import { useFichaStore } from '../store/useFichaStore';
import { Field, MagicVisual, SpellCard, SpellDetailsModal as SharedSpellDetailsModal } from '../components/GrimorioSpellComponents';

type View = 'schools' | 'element-tree' | 'mental-tree' | 'tree' | 'book';
type BookVolume = 1 | 2 | 3;

const grimorioAllSchools = [...grimorioSchools, ...grimorioElementos, ...grimorioMentalizacao, ...grimorioAdditionalSchools];
const grimorioFormSchools = [...grimorioSchools, ...grimorioAdditionalSchools];

const resolveDestinationSchool = (selectedSchoolId: string, subcategory: string) => {
  const selectedSchool = grimorioAllSchools.find((item) => item.id === selectedSchoolId);
  if (!selectedSchool || (selectedSchool.id !== 'elementar' && selectedSchool.id !== 'mentalizacao')) return selectedSchool;

  const normalizedSubcategory = subcategory.trim().toLowerCase();
  const subcategories = selectedSchool.id === 'elementar' ? grimorioElementos : grimorioMentalizacao;
  return subcategories.find((item) =>
    item.name.toLowerCase() === normalizedSubcategory || item.subtitle.toLowerCase() === normalizedSubcategory,
  ) ?? selectedSchool;
};

const ACTIVE_CHARACTER_LABEL = 'Personagem ativo';

interface NewSpellForm {
  name: string;
  level: GrimorioLevel | '';
  description: string;
  difficulty: string;
  damage: string;
  duration: string;
  range: string;
  magicalEffects: string;
  consumption: string;
  type: string;
  channeling: string;
  condition: string;
  schoolId: string;
  subcategory: string;
  image: string;
  bookVolume: BookVolume | '';
}

const initialNewSpellForm: NewSpellForm = {
  name: '', level: '', description: '', difficulty: '', damage: '', duration: '', range: '', magicalEffects: '',
  consumption: '', type: '', channeling: '', condition: '', schoolId: '', subcategory: '', image: '', bookVolume: '',
};

export const GrimorioPage: React.FC = () => {
  const { can, tenantId } = useAuthorization();
  const canManageCatalog = can.manageCatalog;
  const canManageVisibility = can.manageSpellVisibility;
  const { imagensPesadas, bytesPesados, processando, processadas, erroOtimizacao, otimizarImagens } = useOtimizarImagensGrimorio(canManageCatalog);
  const storeCharacterId = useFichaStore((state) => state.characterId);
  const setStoreCharacterId = useFichaStore((state) => state.setCharacterId);
  const [view, setView] = useState<View>('schools');
  const [schoolId, setSchoolId] = useState('elementar');
  const [branch, setBranch] = useState('');
  const [volumeId, setVolumeId] = useState('');
  const [selectedSpell, setSelectedSpell] = useState<GrimorioSpell | null>(null);
  const [personagemId, setPersonagemId] = useState<string>(() => storeCharacterId);
  const [listaPersonagens, setListaPersonagens] = useState<PersonagemResumo[]>([]);
  const [isLoadingPersonagens, setIsLoadingPersonagens] = useState(true);
  const [erroPersonagens, setErroPersonagens] = useState<string | null>(null);
  const [recarregarPersonagensToken, setRecarregarPersonagensToken] = useState(0);
  const [isModalCompradorOpen, setIsModalCompradorOpen] = useState(false);
  const [learnedIds, setLearnedIds] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSpellForm, setNewSpellForm] = useState<NewSpellForm>(initialNewSpellForm);
  const [editingSpell, setEditingSpell] = useState<GrimorioSpell | null>(null);
  const [folioPage, setFolioPage] = useState(1);
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');
  const [erroMutacaoGrimorio, setErroMutacaoGrimorio] = useState<string | null>(null);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erroUploadImagem, setErroUploadImagem] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const carregarListaPersonagens = async () => {
      setIsLoadingPersonagens(true);
      setErroPersonagens(null);
      try {
        const lista = await withTimeout(fichaService.getListaPersonagens());
        if (!isMounted) return;
        setListaPersonagens(lista);
        if (lista.length > 0 && !lista.some((personagem) => personagem.id === personagemId)) {
          const personagemFallback = lista[0];
          setPersonagemId(personagemFallback.id);
          setStoreCharacterId(personagemFallback.id);
        }
      } catch (error) {
        console.error('Erro ao carregar lista de personagens do Grimório', error);
        if (isMounted) {
          setListaPersonagens([]);
          setErroPersonagens(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar a lista de personagens do grimório.'
          );
        }
      } finally {
        if (isMounted) setIsLoadingPersonagens(false);
      }
    };

    carregarListaPersonagens();
    return () => {
      isMounted = false;
    };
  }, [setStoreCharacterId, recarregarPersonagensToken]);

  useEffect(() => {
    let isCurrent = true;
    setLearnedIds([]);
    const loadLearnedSpells = async () => {
      try {
        const ids = await withTimeout(getLearnedSpellIds(personagemId));
        if (isCurrent) setLearnedIds(ids);
      } catch (error) {
        console.error('Erro ao carregar magias aprendidas do Grimório', error);
      }
    };
    void loadLearnedSpells();
    return () => {
      isCurrent = false;
    };
  }, [personagemId]);

  const selectedPersonagem = listaPersonagens.find((personagem) => personagem.id === personagemId);
  const selectCharacter = (id: string) => {
    setPersonagemId(id);
    setStoreCharacterId(id);
  };

  const school = grimorioAllSchools.find((item) => item.id === schoolId) ?? grimorioSchools[0];
  const volumes = getSchoolVolumes(school.id);
  const selectedVolume = volumes.find((volume) => volume.id === volumeId) ?? volumes[0];
  const termoBusca = normalizarBusca(buscaDebounced);
  const buscandoMagias = termoBusca.length >= TAMANHO_MINIMO_BUSCA;
  const queryClient = useQueryClient();
  const chaveConsultaGrimorio = useCallback((pagina: number) => ['grimorio', buscandoMagias
    ? { busca: termoBusca, page: pagina, pageSize: 10 }
    : { volumeId: selectedVolume?.id, page: pagina, pageSize: 10 }], [buscandoMagias, termoBusca, selectedVolume?.id]);
  const carregarPaginaGrimorio = useCallback((pagina: number) => withTimeout(buscandoMagias
    ? buscarMagias(termoBusca, { page: pagina, pageSize: 10 })
    : listarMagiasDoVolume(selectedVolume!.id, { page: pagina, pageSize: 10 })), [buscandoMagias, termoBusca, selectedVolume?.id]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setBuscaDebounced(normalizarBusca(busca)), 300);
    return () => window.clearTimeout(timeout);
  }, [busca]);

  const grimorioQuery = useQuery({
    queryKey: chaveConsultaGrimorio(folioPage),
    queryFn: () => carregarPaginaGrimorio(folioPage),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    enabled: buscandoMagias || Boolean(selectedVolume?.id),
  });
  const isLoadingGrimorio = grimorioQuery.isLoading;
  const erroGrimorio = erroMutacaoGrimorio ?? (grimorioQuery.error
    ? `Não foi possível carregar o grimório: ${grimorioQuery.error instanceof Error ? grimorioQuery.error.message : String(grimorioQuery.error)}`
    : null);
  const spells = grimorioQuery.data?.magias ?? [];
  const hiddenSpellIds = grimorioQuery.data?.ocultas ?? [];
  const totalMagias = grimorioQuery.data?.total ?? 0;
  const bookSpells = spells.filter((spell) => canManageVisibility || !hiddenSpellIds.includes(spell.id));
  const totalFolios = Math.ceil(totalMagias / 10);

  useEffect(() => {
    if (grimorioQuery.isPlaceholderData || grimorioQuery.isFetching || grimorioQuery.isError || !grimorioQuery.data || folioPage >= totalFolios) return;
    const proximaPagina = folioPage + 1;
    void queryClient.prefetchQuery({
      queryKey: chaveConsultaGrimorio(proximaPagina),
      queryFn: () => carregarPaginaGrimorio(proximaPagina),
      staleTime: 5 * 60 * 1000,
    });
  }, [grimorioQuery.isPlaceholderData, grimorioQuery.isFetching, grimorioQuery.isError, grimorioQuery.data, folioPage, totalFolios, queryClient, chaveConsultaGrimorio, carregarPaginaGrimorio]);

  const isEditing = editingSpell !== null;

  useEffect(() => {
    setFolioPage(1);
  }, [schoolId, selectedVolume?.id]);

  const executarMutacaoGrimorio = async (acao: () => Promise<void>) => {
    setErroMutacaoGrimorio(null);
    try {
      await acao();
      await queryClient.invalidateQueries({ queryKey: ['grimorio'] });
    } catch (error) {
      setErroMutacaoGrimorio(error instanceof Error ? error.message : String(error));
    }
  };

  const formSchool = grimorioAllSchools.find((item) => item.id === newSpellForm.schoolId);
  const formSubcategoryCatalog = formSchool?.id === 'elementar' ? grimorioElementos : formSchool?.id === 'mentalizacao' ? grimorioMentalizacao : [];
  const formDestinationSchool = resolveDestinationSchool(newSpellForm.schoolId, newSpellForm.subcategory) ?? formSchool ?? school;
  const formVolumes = getSchoolVolumes(formDestinationSchool.id);
  const formVolume = newSpellForm.bookVolume
    ? formVolumes[newSpellForm.bookVolume - 1]
    : formVolumes.find((volume) => volume.id === selectedVolume.id) ?? formVolumes[0];

  const chooseSchool = (id: string, chosenBranch = '') => {
    setSchoolId(id);
    setBranch(chosenBranch);
    setVolumeId('');
    setFolioPage(1);
    setView(id === 'elementar' ? 'element-tree' : id === 'mentalizacao' ? 'mental-tree' : 'tree');
  };

  const chooseElement = (id: string) => {
    const element = grimorioElementos.find((item) => item.id === id);
    if (!element) return;
    setSchoolId(element.id);
    setBranch(element.subtitle);
    setVolumeId('');
    setFolioPage(1);
    setView('tree');
  };

  const chooseMentalizacaoSubcategory = (id: string) => {
    const subcategory = grimorioMentalizacao.find((item) => item.id === id);
    if (!subcategory) return;
    setSchoolId(subcategory.id);
    setBranch(subcategory.subtitle);
    setVolumeId('');
    setFolioPage(1);
    setView('tree');
  };

  const chooseVolume = (id: string) => {
    setVolumeId(id);
    setFolioPage(1);
    setView('book');
  };

  const goBack = () => {
    if (view === 'book') setView('tree');
    else if (view === 'tree') {
      if (grimorioElementos.some((item) => item.id === schoolId)) {
        setSchoolId('elementar');
        setBranch('');
        setVolumeId('');
        setView('element-tree');
      } else if (grimorioMentalizacao.some((item) => item.id === schoolId)) {
        setSchoolId('mentalizacao');
        setBranch('');
        setVolumeId('');
        setView('mental-tree');
      } else {
        setView('schools');
      }
    } else if (view === 'element-tree' || view === 'mental-tree') setView('schools');
  };

  const toggleLearned = (spellId: string) => {
    const learned = !learnedIds.includes(spellId);
    setLearnedIds((current) => learned ? [...current, spellId] : current.filter((id) => id !== spellId));
    void setLearnedSpell(personagemId, spellId, learned).catch(async (error) => {
      console.error('Erro ao atualizar magia aprendida no Grimório', error);
      try {
        setLearnedIds(await withTimeout(getLearnedSpellIds(personagemId)));
      } catch (reloadError) {
        console.error('Erro ao recarregar magias aprendidas do Grimório', reloadError);
      }
    });
  };

  const openEdit = (spell: GrimorioSpell) => {
    if (!canManageCatalog) return;
    const spellVolume = grimorioVolumes.find((volume) => volume.id === spell.volumeId);
    const spellElement = grimorioElementos.find((item) => item.id === spell.schoolId);
    const spellMentalizacaoSubcategory = grimorioMentalizacao.find((item) => item.id === spell.schoolId);
    const hasCustomBookVolume = Object.prototype.hasOwnProperty.call(spell, 'bookVolume');
    const bookVolume = hasCustomBookVolume ? (spell.bookVolume ?? '') : (spellVolume?.number === 'I' ? 1 : spellVolume?.number === 'II' ? 2 : spellVolume?.number === 'III' ? 3 : '');
    const formSchoolId = spellMentalizacaoSubcategory ? 'mentalizacao' : spellElement ? 'elementar' : spell.schoolId;
    const formSubcategory = spell.subcategory ?? spellMentalizacaoSubcategory?.name ?? spellElement?.name ?? '';
    setSelectedSpell(null);
    setEditingSpell(spell);
    setNewSpellForm({
      name: spell.name,
      level: spell.level,
      description: spell.description,
      difficulty: spell.difficulty,
      damage: spell.damage,
      duration: spell.duration,
      range: spell.range,
      magicalEffects: spell.magicalEffects,
      consumption: spell.consumption,
      type: spell.type,
      channeling: spell.channeling,
      condition: spell.condition,
      schoolId: formSchoolId || '',
      subcategory: formSubcategory,
      image: spell.image ?? '',
      bookVolume,
    });
    setIsCreateOpen(true);
  };

  const toggleHidden = (spellId: string) => {
    if (!canManageVisibility) return;
    void executarMutacaoGrimorio(() => alternarOculta(spellId, !hiddenSpellIds.includes(spellId)));
  };

  const deleteSpell = (spell: GrimorioSpell) => {
    if (!canManageCatalog || !window.confirm(`Excluir a magia "${spell.name || '-'}"? Esta ação não pode ser desfeita.`)) return;
    void executarMutacaoGrimorio(() => excluirMagia(spell.id));
    setSelectedSpell((current) => current?.id === spell.id ? null : current);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErroUploadImagem('Selecione um arquivo de imagem válido.');
      return;
    }

    setErroUploadImagem(null);
    setEnviandoImagem(true);
    try {
      const url = await enviarImagem(file, 'grimorio', { maxWidth: 600, maxHeight: 600, quality: 0.82 });
      setNewSpellForm((current) => ({ ...current, image: url }));
    } catch (error) {
      setErroUploadImagem(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.');
    } finally {
      setEnviandoImagem(false);
    }
  };

  const handleSpellSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enviandoImagem) return;
    const destinationSchool = resolveDestinationSchool(newSpellForm.schoolId, newSpellForm.subcategory) ?? formSchool ?? school;
    const destinationVolumes = getSchoolVolumes(destinationSchool.id);
    const destinationVolume = newSpellForm.bookVolume
      ? destinationVolumes[newSpellForm.bookVolume - 1]
      : destinationVolumes.find((volume) => volume.id === selectedVolume.id) ?? destinationVolumes[0];

    if (editingSpell) {
      if (!canManageCatalog) return;
      const spell = editingSpell;
      const editedSpell: GrimorioSpell = {
        ...spell,
        schoolId: destinationSchool.id,
        volumeId: destinationVolume.id,
        name: newSpellForm.name.trim(),
        level: newSpellForm.level,
        description: newSpellForm.description,
        difficulty: newSpellForm.difficulty,
        damage: newSpellForm.damage,
        duration: newSpellForm.duration,
        range: newSpellForm.range,
        magicalEffects: newSpellForm.magicalEffects,
        consumption: newSpellForm.consumption,
        type: newSpellForm.type,
        channeling: newSpellForm.channeling,
        condition: newSpellForm.condition,
        subcategory: newSpellForm.subcategory || undefined,
        image: newSpellForm.image || spell.image || undefined,
        bookVolume: newSpellForm.bookVolume || undefined,
      };
      void executarMutacaoGrimorio(() => atualizarMagia(editedSpell));
      setEditingSpell(null);
      setNewSpellForm(initialNewSpellForm);
      setIsCreateOpen(false);
      setSchoolId(destinationSchool.id);
      setBranch(newSpellForm.subcategory);
      setVolumeId(destinationVolume.id);
      setFolioPage(1);
      setView('book');
      return;
    }

    if (!canManageCatalog) return;
    const id = `custom-spell-${Date.now()}`;
    const newSpell: GrimorioSpell = {
      id,
      schoolId: destinationSchool.id,
      volumeId: destinationVolume.id,
      name: newSpellForm.name.trim(),
      level: newSpellForm.level,
      description: newSpellForm.description,
      difficulty: newSpellForm.difficulty,
      damage: newSpellForm.damage,
      duration: newSpellForm.duration,
      range: newSpellForm.range,
      magicalEffects: newSpellForm.magicalEffects,
      consumption: newSpellForm.consumption,
      type: newSpellForm.type,
      channeling: newSpellForm.channeling,
      condition: newSpellForm.condition,
      visual: destinationSchool.id === 'elementar' ? 'fire' : 'earth',
      subcategory: newSpellForm.subcategory || undefined,
      image: newSpellForm.image || undefined,
      bookVolume: newSpellForm.bookVolume || undefined,
    };
    void executarMutacaoGrimorio(() => criarMagia(newSpell));
    setNewSpellForm(initialNewSpellForm);
    setIsCreateOpen(false);
    setSchoolId(destinationSchool.id);
    setBranch(newSpellForm.subcategory);
    setVolumeId(destinationVolume.id);
    setFolioPage(1);
    setView('book');
  };

  const headerAction = (
    <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
      {tenantId && <button
        id="btn-abrir-modal-personagem-grimorio"
        type="button"
        onClick={() => setIsModalCompradorOpen(true)}
        aria-label="Selecionar personagem para aprender magias"
        title="Clique para selecionar o personagem das magias aprendidas"
        className="flex h-10 w-full min-w-0 items-center justify-between gap-1.5 rounded-xs border border-[#5a4225] bg-[#120f0d]/95 px-2.5 text-left shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all hover:border-[#c5a059] hover:bg-[#1c140d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#c5a059] sm:w-auto sm:gap-2.5 sm:px-3"
      >
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          {selectedPersonagem?.imagem_url ? (
            <img
              src={selectedPersonagem.imagem_url}
              alt={selectedPersonagem.nome}
              className="h-6 w-6 shrink-0 rounded-xs border border-[#8c6b41] object-cover sm:h-7 sm:w-7"
            />
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-xs border border-[#5a4225] bg-[#24170d] text-[#c5a059] sm:h-7 sm:w-7">
              <User size={13} />
            </div>
          )}
          <div className="min-w-0">
            <span className="mb-0.5 block font-cinzel text-[7.5px] uppercase leading-none tracking-wider text-[#8c6b41] sm:text-[8px]">Personagem</span>
            <span className="block truncate font-cinzel text-[11px] font-bold leading-tight text-[#f2dfa8] sm:text-xs">
              {selectedPersonagem?.nome ?? (isLoadingPersonagens ? 'Carregando…' : 'Selecionar')}
            </span>
          </div>
        </div>
        <Search size={13} className="ml-0.5 shrink-0 text-[#8c6b41]" />
      </button>}
      {tenantId && view !== 'schools' && <span className="text-[10px] uppercase tracking-widest text-[#8c6b41]">{ACTIVE_CHARACTER_LABEL}</span>}
      {canManageCatalog && <GothicButton
        type="button"
        onClick={() => setIsCreateOpen(true)}
        variant="primary"
        size="xs"
        width="100%"
        height={30}
        className="max-[639px]:!h-11 sm:!w-[125px]"
        icon={<Plus size={14} />}
      >
        Criar magia
      </GothicButton>}
    </div>
  );

  return (
    <div id="page-grimorio" className="mx-auto w-full max-w-[1100px] space-y-6">
      <MedievalFrame
        title={<h2 className="flex items-center gap-2 text-xl font-bold tracking-wider text-[#e6ddc5] uppercase"><BookOpen className="h-5 w-5 text-[#a88d61]" /> Grimório de Magias</h2>}
        subtitle="Escolas arcanas, níveis de conjuração e rituais do sistema"
        headerRight={headerAction}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="grimorio-search" className="block text-[10px] uppercase tracking-[0.22em] text-[#8c6b41]">Buscar magia em todos os volumes</label>
            <div className="flex items-center gap-2 border border-[#5a4225] bg-[#120d09] px-3 focus-within:border-[#c6a15b] focus-within:ring-1 focus-within:ring-[#c6a15b]">
              <Search size={16} className="shrink-0 text-[#8c6b41]" aria-hidden="true" />
              <input
                id="grimorio-search"
                type="search"
                value={busca}
                onChange={(event) => { setBusca(event.target.value); setFolioPage(1); }}
                placeholder="Nome, efeito, escola…"
                className="h-11 min-w-0 flex-1 bg-transparent text-sm text-[#e6ddc5] outline-none placeholder:text-[#74634d] focus-visible:outline-none"
              />
              {busca && <button
                type="button"
                onClick={() => { setBusca(''); setFolioPage(1); }}
                aria-label="Limpar busca de magias"
                className="flex h-8 w-8 shrink-0 items-center justify-center text-[#a88d61] transition hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]"
              ><X size={16} /></button>}
            </div>
          </div>
          {canManageCatalog && imagensPesadas.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border border-[#5a4225] bg-[#1c140d] px-4 py-3">
              <p className="text-xs text-[#c4b9a3]">
                {imagensPesadas.length} imagens do grimório ainda estão no tamanho original ({(bytesPesados / 1048576).toFixed(1)} MB) e deixam a leitura do livro lenta.
                {processando && <span className="ml-2 uppercase tracking-widest text-[#c6a15b]">Otimizando… {processadas}/{imagensPesadas.length}</span>}
                {erroOtimizacao && <span className="ml-2 text-[#d98f6a]">{erroOtimizacao}</span>}
              </p>
              <GothicButton type="button" variant="secondary" size="xs" width={170} disabled={processando} onClick={() => void otimizarImagens()}>
                {processando ? 'Otimizando…' : 'Otimizar imagens'}
              </GothicButton>
            </div>
          )}
          {isLoadingGrimorio ? (
            <LoadingState
              variant="text"
              label="Consultando os arquivos arcanos…"
              className="rounded-xs border border-[#3a2c1d] bg-[#0c0806]/80 px-4 py-6"
            />
          ) : erroGrimorio ? (
            <ErrorState
              title="Falha ao carregar o grimório"
              description={erroGrimorio}
              className="py-6"
              onRetry={() => {
                setRecarregarPersonagensToken((token) => token + 1);
                setErroMutacaoGrimorio(null);
                void grimorioQuery.refetch();
              }}
            />
          ) : null}
          {!isLoadingGrimorio && !erroGrimorio && tenantId && !isLoadingPersonagens && erroPersonagens && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#c4b9a3]" role="status">
              <span>Não foi possível carregar a lista de personagens: {erroPersonagens}</span>
              <button type="button" onClick={() => setRecarregarPersonagensToken((token) => token + 1)} className="text-[#d6b56a] underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]">
                Tentar novamente
              </button>
            </div>
          )}
          {!isLoadingGrimorio && !erroGrimorio && tenantId && !isLoadingPersonagens && !erroPersonagens && listaPersonagens.length === 0 && (
            <p className="text-xs text-[#8c6b41]" role="status">
              Nenhum personagem encontrado. Crie um personagem na aba Personagens para vincular as magias aprendidas.
            </p>
          )}

          {view !== 'schools' && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3a2c1d] pb-4">
              <button type="button" onClick={goBack} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#b49768] transition hover:text-[#f0d68b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]"><ArrowLeft size={16} /> Voltar</button>
              <p className="font-cinzel text-xs uppercase tracking-widest text-[#e6ddc5]">{school.name}{branch ? ` · ${branch}` : ''}{view === 'book' ? ` · ${selectedVolume.title}` : view === 'element-tree' ? ' · Seleção de elementos' : view === 'mental-tree' ? ' · Seleção de subcategorias' : ' · Árvore de volumes'}</p>
            </div>
          )}

          {!buscandoMagias && view === 'schools' && <SchoolsView onChoose={chooseSchool} onCreate={canManageCatalog ? () => setIsCreateOpen(true) : undefined} />}
          {!buscandoMagias && view === 'element-tree' && <ElementTreeView onChooseElement={chooseElement} />}
          {!buscandoMagias && view === 'mental-tree' && <MentalizacaoTreeView onChooseSubcategory={chooseMentalizacaoSubcategory} />}
          {!buscandoMagias && view === 'tree' && <TreeView school={school} volumes={volumes} onChooseVolume={chooseVolume} />}
          {!buscandoMagias && view === 'book' && (
            <BookView
              school={school}
              volume={selectedVolume}
              spells={bookSpells}
              allBookSpells={totalMagias}
              page={folioPage}
              totalPages={totalFolios}
              onPageChange={setFolioPage}
              learnedIds={learnedIds}
              canManageCatalog={canManageCatalog}
              canManageVisibility={canManageVisibility}
              hiddenSpellIds={hiddenSpellIds}
              onOpenSpell={setSelectedSpell}
              onToggleLearned={toggleLearned}
              onEdit={openEdit}
              onToggleHidden={toggleHidden}
              onDelete={deleteSpell}
            />
          )}
          {buscandoMagias && (
            <section aria-labelledby="grimorio-search-results" className="space-y-4">
              <p id="grimorio-search-results" className="border-b border-[#3a2c1d] pb-3 text-xs text-[#a88d61]" role="status">
                Resultados da busca em todos os volumes para <strong className="text-[#e6ddc5]">“{termoBusca}”</strong> · {totalMagias} {totalMagias === 1 ? 'magia' : 'magias'}
              </p>
              {totalMagias === 0 ? (
                <EmptyState
                  title="Nenhuma magia encontrada"
                  description="Não há fórmulas que correspondam a esta busca."
                  action={<button type="button" onClick={() => { setBusca(''); setFolioPage(1); }} className="text-xs uppercase tracking-widest text-[#d6b56a] underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]">Limpar busca</button>}
                />
              ) : (
                <>
                  <div className="space-y-3">
                    {bookSpells.map((spell) => <SpellCard
                      key={spell.id}
                      spell={spell}
                      learned={learnedIds.includes(spell.id)}
                      hidden={hiddenSpellIds.includes(spell.id)}
                      canManage={canManageCatalog}
                      canToggleHidden={canManageVisibility}
                      onOpen={() => setSelectedSpell(spell)}
                      onToggleLearned={() => toggleLearned(spell.id)}
                      onEdit={() => openEdit(spell)}
                      onToggleHidden={() => toggleHidden(spell.id)}
                      onDelete={() => deleteSpell(spell)}
                    />)}
                  </div>
                  {totalFolios > 1 && <nav aria-label="Navegação entre páginas dos resultados da busca" className="flex flex-wrap items-center justify-center gap-3">
                    <GothicButton type="button" variant="secondary" size="xs" width={150} disabled={folioPage <= 1} onClick={() => setFolioPage(folioPage - 1)}>Página anterior</GothicButton>
                    <span className="font-cinzel text-[10px] uppercase tracking-widest text-[#c6a15b]">Página {folioPage} de {totalFolios}</span>
                    <GothicButton type="button" variant="secondary" size="xs" width={150} disabled={folioPage >= totalFolios} onClick={() => setFolioPage(folioPage + 1)}>Próxima página</GothicButton>
                  </nav>}
                </>
              )}
            </section>
          )}
        </div>
      </MedievalFrame>

      {selectedSpell && (canManageVisibility || !hiddenSpellIds.includes(selectedSpell.id)) && (
        <SharedSpellDetailsModal
          spell={selectedSpell}
          learned={learnedIds.includes(selectedSpell.id)}
          canManage={canManageCatalog}
          canToggleHidden={canManageVisibility}
          hidden={hiddenSpellIds.includes(selectedSpell.id)}
          onClose={() => setSelectedSpell(null)}
          onToggleLearned={() => toggleLearned(selectedSpell.id)}
          onEdit={() => openEdit(selectedSpell)}
          onToggleHidden={() => toggleHidden(selectedSpell.id)}
          onDelete={() => deleteSpell(selectedSpell)}
        />
      )}

      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); setEditingSpell(null); setNewSpellForm(initialNewSpellForm); }} title={isEditing ? 'Editar magia' : 'Inscrever nova magia'} subtitle={isEditing ? 'Alterar registro existente' : 'Adicionar ao volume selecionado'} maxWidth="max-w-[560px]">
        <form onSubmit={handleSpellSubmit} className="space-y-5">
          <p className="border-l-2 border-[#a88d61] bg-[#21170e] px-3 py-2 text-xs text-[#c4b9a3]">{isEditing ? 'As alterações serão salvas sobre esta fórmula em' : 'A nova fórmula será inserida em'} <strong className="text-[#e2c981]">{formDestinationSchool.name} · {formVolume?.title ?? selectedVolume.title}</strong>. Os dados originais permanecem intactos.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="new-spell-name" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Nome da magia<input id="new-spell-name" value={newSpellForm.name} onChange={(event) => setNewSpellForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" placeholder="Ex.: Lâmina do crepúsculo" /></label>
            <label htmlFor="new-spell-level" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Nível<select id="new-spell-level" value={newSpellForm.level} onChange={(event) => setNewSpellForm((current) => ({ ...current, level: event.target.value as GrimorioLevel | '' }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]"><option value="">-</option>{GRIMORIO_LEVELS.map((level) => <option key={level}>{level}</option>)}</select></label>
          </div>
          <label htmlFor="new-spell-description" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Descrição<textarea id="new-spell-description" value={newSpellForm.description} onChange={(event) => setNewSpellForm((current) => ({ ...current, description: event.target.value }))} className="mt-1 min-h-20 w-full border border-[#5a4225] bg-[#120d09] px-3 py-2 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="new-spell-difficulty" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Dificuldade<input id="new-spell-difficulty" value={newSpellForm.difficulty} onChange={(event) => setNewSpellForm((current) => ({ ...current, difficulty: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
            <label htmlFor="new-spell-damage" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Dano<input id="new-spell-damage" value={newSpellForm.damage} onChange={(event) => setNewSpellForm((current) => ({ ...current, damage: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
            <label htmlFor="new-spell-duration" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Duração<input id="new-spell-duration" value={newSpellForm.duration} onChange={(event) => setNewSpellForm((current) => ({ ...current, duration: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
            <label htmlFor="new-spell-range" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Alcance<input id="new-spell-range" value={newSpellForm.range} onChange={(event) => setNewSpellForm((current) => ({ ...current, range: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
            <label htmlFor="new-spell-consumption" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Consumo<input id="new-spell-consumption" value={newSpellForm.consumption} onChange={(event) => setNewSpellForm((current) => ({ ...current, consumption: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
            <label htmlFor="new-spell-type" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Tipo<input id="new-spell-type" value={newSpellForm.type} onChange={(event) => setNewSpellForm((current) => ({ ...current, type: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
            <label htmlFor="new-spell-channeling" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Canalização<input id="new-spell-channeling" value={newSpellForm.channeling} onChange={(event) => setNewSpellForm((current) => ({ ...current, channeling: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
            <label htmlFor="new-spell-condition" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Condição<input id="new-spell-condition" value={newSpellForm.condition} onChange={(event) => setNewSpellForm((current) => ({ ...current, condition: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
          </div>
          <label htmlFor="new-spell-effects" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Efeitos mágicos<textarea id="new-spell-effects" value={newSpellForm.magicalEffects} onChange={(event) => setNewSpellForm((current) => ({ ...current, magicalEffects: event.target.value }))} className="mt-1 min-h-20 w-full border border-[#5a4225] bg-[#120d09] px-3 py-2 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="new-spell-school" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Escola<select id="new-spell-school" value={newSpellForm.schoolId} onChange={(event) => setNewSpellForm((current) => ({ ...current, schoolId: event.target.value, subcategory: '' }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]"><option value="">-</option>{grimorioFormSchools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            {(formSchool?.id === 'elementar' || formSchool?.id === 'mentalizacao') && <label htmlFor="new-spell-subcategory" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Subcategoria<input id="new-spell-subcategory" list="new-spell-subcategory-options" type="text" value={newSpellForm.subcategory} onChange={(event) => setNewSpellForm((current) => ({ ...current, subcategory: event.target.value }))} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]" /><datalist id="new-spell-subcategory-options">{formSubcategoryCatalog.map((item) => <option key={item.id} value={item.name}>{item.subtitle}</option>)}</datalist></label>}
            <label htmlFor="new-spell-book-volume" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Livro Vol<select id="new-spell-book-volume" value={newSpellForm.bookVolume} onChange={(event) => { const value = event.target.value; const bookVolume: BookVolume | '' = value === '1' ? 1 : value === '2' ? 2 : value === '3' ? 3 : ''; setNewSpellForm((current) => ({ ...current, bookVolume })); }} className="mt-1 h-10 w-full border border-[#5a4225] bg-[#120d09] px-3 text-sm normal-case tracking-normal text-[#e6ddc5] outline-none focus-visible:border-[#c6a15b] focus-visible:ring-1 focus-visible:ring-[#c6a15b]"><option value="">-</option><option value="1">1</option><option value="2">2</option><option value="3">3</option></select></label>
            <label htmlFor="new-spell-image" className="block text-[10px] uppercase tracking-widest text-[#8c6b41]">Imagem<input id="new-spell-image" type="file" accept="image/*" disabled={enviandoImagem} onChange={handleImageChange} className="mt-1 block h-10 w-full border border-[#5a4225] bg-[#120d09] px-2 py-2 text-xs normal-case tracking-normal text-[#e6ddc5] file:mr-2 file:border-0 file:bg-[#5a4225] file:px-2 file:py-1 file:text-xs file:text-[#f1d994] disabled:opacity-60" />{enviandoImagem && <span className="mt-1 block normal-case tracking-normal text-[#d4af37]" role="status">Enviando imagem…</span>}</label>
          </div>
          {erroUploadImagem && <p className="border-l-2 border-[#b56a55] bg-[#2a120d] px-3 py-2 text-xs text-[#f0b09b]" role="alert">{erroUploadImagem}</p>}
          <div className="flex justify-end gap-2 border-t border-[#3a2c1d] pt-4"><button type="button" onClick={() => { setIsCreateOpen(false); setEditingSpell(null); setNewSpellForm(initialNewSpellForm); }} className="flex items-center gap-1.5 border border-[#4a351f] px-4 py-2 text-xs uppercase tracking-widest text-[#a88d61] hover:text-[#e6ddc5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a]"><X size={14} /> Cancelar</button><button type="submit" disabled={enviandoImagem} className="flex items-center gap-1.5 border border-[#a88d61] bg-[#5a4225]/40 px-4 py-2 text-xs uppercase tracking-widest text-[#f1d994] hover:bg-[#765b36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a] disabled:cursor-not-allowed disabled:opacity-60"><WandSparkles size={14} /> {enviandoImagem ? 'Enviando imagem…' : isEditing ? 'Salvar alterações' : 'Inscrever magia'}</button></div>
        </form>
      </Modal>

      <ModalSelecionarComprador
        isOpen={isModalCompradorOpen}
        onClose={() => setIsModalCompradorOpen(false)}
        personagens={listaPersonagens}
        personagemSelecionadoId={personagemId}
        onSelecionar={selectCharacter}
      />
    </div>
  );
};

const SchoolsView = ({ onChoose, onCreate }: { onChoose: (schoolId: string, branch?: string) => void; onCreate?: () => void }) => {
  return (
    <>
      <section aria-labelledby="schools-heading" className="space-y-5 max-[639px]:space-y-7">
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3"><div><p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Círculo de conhecimento</p><h3 id="schools-heading" className="mt-1 font-cinzel text-lg uppercase tracking-wider text-[#e6ddc5]">Escolha uma escola arcana</h3></div><p className="max-w-none text-left text-xs italic text-[#8f806a] sm:max-w-xs sm:text-right">Cada círculo guarda três volumes de fórmulas e segredos.</p></div>
    <div className="relative mx-auto flex aspect-square w-full max-w-[580px] items-center justify-center rounded-full bg-[#0c0907] shadow-[0_0_50px_rgba(0,0,0,0.8)] max-[639px]:my-2 max-[639px]:max-w-[360px]">
      <div className="absolute inset-[6%] rounded-full border border-[#6b4f2d]/70" /><div className="absolute inset-[16%] rounded-full border border-[#8c6b41]/60" /><div className="absolute inset-[29%] rotate-45 border border-[#8c6b41]/40" /><div className="absolute inset-[29%] -rotate-45 border border-[#8c6b41]/40" /><div className="absolute left-1/2 top-[10%] h-[80%] w-px bg-[#6b4f2d]/40" /><div className="absolute left-[10%] top-1/2 h-px w-[80%] bg-[#6b4f2d]/40" />
      <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full border border-[#a88d61] bg-[#1a110a] text-center shadow-[0_0_25px_rgba(168,141,97,0.2)] max-[639px]:h-20 max-[639px]:w-20"><TreePine className="mb-1 text-[#d8b86b]" size={24} /><span className="font-cinzel text-[11px] uppercase tracking-widest text-[#e6ddc5] max-[639px]:text-[9px]">Círculo Mágico</span><span className="mt-1 text-[10px] italic text-[#8c6b41] max-[639px]:text-[8px]">Escolas do Grimório</span></div>
      {grimorioSchools.map((item, index) => { const position = [{ top: '2%', left: '50%', transform: 'translateX(-50%)' }, { top: '19%', right: '3%' }, { top: '61%', right: '3%' }, { bottom: '2%', left: '50%', transform: 'translateX(-50%)' }, { top: '61%', left: '3%' }, { top: '19%', left: '3%' }, { top: '41%', left: '50%', transform: 'translate(-50%, -50%)' }][index]; return <button key={item.id} type="button" onClick={() => onChoose(item.id)} style={{ ...position, borderColor: item.accent }} className={`absolute z-20 flex size-[105px] -translate-y-1/2 flex-col items-center justify-center rounded-full border bg-[#17100b] px-3 py-2 text-center shadow-lg transition hover:-translate-y-2 hover:bg-[#2a1d12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] max-[639px]:size-[60px] max-[639px]:px-0.5 max-[639px]:leading-[1.05] max-[639px]:text-[7px] sm:size-[125px] ${index === 2 || index === 4 ? 'max-[639px]:!top-[73%]' : index === 6 ? 'max-[639px]:!top-[35%]' : ''}`}><span className="block break-words font-cinzel text-[10px] uppercase leading-tight tracking-wide text-[#eadfc8] max-[639px]:text-[7px]">{item.name}</span><span className="mt-1 block break-words text-[10px] italic leading-tight text-[#9d896b] max-[639px]:text-[7px]">{item.subtitle}</span>{item.id !== 'elementar' && item.branches && <span className="mt-1 block break-words text-[9px] leading-tight text-[#c6a15b] max-[639px]:text-[7px]">Fogo · Água · Ar · Terra</span>}</button>; })}
    </div>
    {onCreate && <div className="flex justify-center border-t border-[#3a2c1d] pt-4"><button type="button" onClick={onCreate} className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#b49768] hover:text-[#f0d68b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b56a] max-[639px]:min-h-11 max-[639px]:px-3"><Plus size={15} /> Inscrever uma magia pessoal</button></div>}
      </section>
      <ExpandedCirclesView onChoose={onChoose} />
    </>
  );
};

const RevealCircle = ({ children }: { children: React.ReactNode }) => {
  const circleRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = circleRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(element);
      }
    }, { threshold: 0.14 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={circleRef} className={`transition duration-1000 ease-out motion-reduce:transition-none ${isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-10 scale-95 opacity-0'}`}>{children}</div>;
};

interface ExpandedCircleSectionProps {
  id: string;
  title: string;
  description: string;
  schools: typeof grimorioAdditionalSchools;
  circleClassName: string;
  onChoose: (schoolId: string) => void;
}

const ExpandedCircleSection = ({ id, title, description, schools, circleClassName, onChoose }: ExpandedCircleSectionProps) => {
  const positions = schools.map((_, index) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / schools.length;
    return { x: 50 + Math.cos(angle) * 40, y: 50 + Math.sin(angle) * 40 };
  });

  return (
    <RevealCircle>
      <section aria-labelledby={`${id}-heading`} className="relative pt-10">
        <div className="pointer-events-none absolute left-1/2 top-0 h-10 w-px -translate-x-1/2 bg-gradient-to-b from-[#8c6b41]/70 to-[#8c6b41]/20" aria-hidden="true" />
      <div className="mb-5 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Círculo revelado</p>
        <h3 id={`${id}-heading`} className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">{title}</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm italic text-[#9f9077]">{description}</p>
      </div>
      <div className={`relative mx-auto aspect-square w-full ${circleClassName} overflow-hidden rounded-full border border-[#4d3822] bg-[radial-gradient(circle_at_center,rgba(116,78,38,0.22),transparent_58%),#0e0a07] shadow-[inset_0_0_55px_rgba(0,0,0,0.75)]`} aria-label={`Círculo ${title} com ${schools.length} escolas`}>
        <div className="pointer-events-none absolute inset-[5%] rounded-full border border-[#6b4f2d]/70" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[17%] rounded-full border border-dashed border-[#8c6b41]/35" aria-hidden="true" />
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {positions.map((position, index) => <line key={`${schools[index].id}-connection`} x1="50" y1="50" x2={position.x} y2={position.y} stroke="#9b7748" strokeWidth="0.34" strokeOpacity="0.72" />)}
          <circle cx="50" cy="50" r="7" fill="#d8b86b" fillOpacity="0.08" stroke="#c6a15b" strokeOpacity="0.62" strokeWidth="0.35" />
        </svg>
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center text-[#8c6b41]" aria-hidden="true">
          <Sparkles className="mx-auto mb-1 text-[#d8b86b]" size={25} />
          <span className="font-cinzel text-[10px] uppercase tracking-[0.2em]">{title}</span>
        </div>
        {schools.map((school, index) => (
          <button
            key={school.id}
            type="button"
            onClick={() => onChoose(school.id)}
            aria-label={`Escolher ${school.name}${school.subtitle ? ` (${school.subtitle})` : ''}`}
            title={school.description}
            style={{ left: `${positions[index].x}%`, top: `${positions[index].y}%`, borderColor: school.accent }}
            className="absolute z-20 flex size-[68px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 bg-[#17100b] px-1.5 text-center shadow-[0_0_18px_rgba(0,0,0,0.75)] transition hover:scale-105 hover:bg-[#2a1d12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] focus-visible:outline-offset-2 max-[639px]:size-[58px] max-[639px]:px-0.5 sm:size-[86px] lg:size-[98px]"
          >
            <span className="block max-w-full break-words font-cinzel text-[8px] uppercase leading-[0.95] tracking-wide text-[#eadfc8] max-[639px]:text-[6px] sm:text-[9px] lg:text-[10px]">{school.name}</span>
            <span className="mt-1 block max-w-full break-words text-[7px] italic leading-[0.95] text-[#c6a15b] max-[639px]:text-[6px] sm:text-[8px] lg:text-[9px]">{school.subtitle}</span>
          </button>
        ))}
      </div>
      </section>
    </RevealCircle>
  );
};

const ExpandedCirclesView = ({ onChoose }: { onChoose: (schoolId: string, branch?: string) => void }) => (
  <div className="relative space-y-10 pt-2">
    <div className="pointer-events-none absolute bottom-12 left-1/2 top-12 z-0 w-px -translate-x-1/2 bg-gradient-to-b from-[#8c6b41]/55 via-[#8c6b41]/25 to-[#8c6b41]/55" aria-hidden="true" />
    <ExpandedCircleSection id="circulo-maior" title="Círculo Maior" description="Tradições vastas para aqueles que já atravessaram o primeiro limiar." schools={grimorioMaiorSchools} circleClassName="max-w-[680px] max-[639px]:max-w-[360px]" onChoose={onChoose} />
    <ExpandedCircleSection id="circulo-exoterico" title="Círculo Exotérico" description="Artes veladas que sondam a mente, os sonhos e os sinais do mundo." schools={grimorioExotericoSchools} circleClassName="max-w-[790px] max-[639px]:max-w-[360px]" onChoose={onChoose} />
    <ExpandedCircleSection id="circulo-cosmico" title="Círculo Cósmico" description="Forças primordiais que regem o espaço, a matéria, a luz e o tempo." schools={grimorioCosmicoSchools} circleClassName="max-w-[900px] max-[639px]:max-w-[360px]" onChoose={onChoose} />
  </div>
);

const MentalizacaoTreeView = ({ onChooseSubcategory }: { onChooseSubcategory: (id: string) => void }) => {
  const positions = [
    { top: '20%', left: '50%', transform: 'translate(-50%, -50%)' },
    { top: '72%', left: '25%', transform: 'translate(-50%, -50%)' },
    { top: '72%', left: '75%', transform: 'translate(-50%, -50%)' },
  ];

  return (
    <section aria-labelledby="mental-tree-heading" className="space-y-6">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Árvore da mentalização</p>
        <h3 id="mental-tree-heading" className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">Escolha um caminho mental</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm italic text-[#9f9077]">Cada círculo guarda os três volumes de uma subcategoria.</p>
      </div>
      <div className="relative mx-auto aspect-square w-full max-w-[580px] overflow-hidden rounded-full border border-[#4d3822] bg-[radial-gradient(circle_at_center,rgba(72,91,133,0.25),transparent_58%),#0e0a07] shadow-[inset_0_0_45px_rgba(0,0,0,0.7)] max-[639px]:max-w-[360px]" aria-label="Círculo de subcategorias da Mentalização">
        <div className="pointer-events-none absolute inset-[6%] rounded-full border border-[#6b4f2d]/70" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[20%] rounded-full border border-dashed border-[#8c6b41]/35" aria-hidden="true" />
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <line x1="50" y1="20" x2="25" y2="72" stroke="#9b7748" strokeWidth="0.4" strokeOpacity="0.72" />
          <line x1="50" y1="20" x2="75" y2="72" stroke="#9b7748" strokeWidth="0.4" strokeOpacity="0.72" />
          <line x1="25" y1="72" x2="75" y2="72" stroke="#9b7748" strokeWidth="0.4" strokeOpacity="0.72" />
        </svg>
        <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 text-center text-[#8c6b41]" aria-hidden="true">
          <Sparkles className="mx-auto mb-1 text-[#d8b86b]" size={25} />
          <span className="font-cinzel text-[10px] uppercase tracking-[0.2em]">Mentalização</span>
        </div>
        {grimorioMentalizacao.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onChooseSubcategory(item.id)}
            aria-label={`Escolher ${item.name}`}
            title={item.description}
            style={{ ...positions[index], borderColor: item.accent }}
            className="absolute z-20 flex size-[112px] flex-col items-center justify-center rounded-full border-2 bg-[#17100b] px-2 text-center shadow-[0_0_18px_rgba(0,0,0,0.7)] transition hover:scale-105 hover:bg-[#2a1d12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] focus-visible:outline-offset-2 max-[639px]:size-[76px] max-[639px]:px-1"
          >
            <span className="block break-words font-cinzel text-[10px] uppercase leading-tight tracking-wide text-[#eadfc8] max-[639px]:text-[8px]">{item.name}</span>
            <span className="mt-1 block break-words text-[9px] italic leading-tight text-[#c6a15b] max-[639px]:text-[7px]">({item.subtitle})</span>
          </button>
        ))}
      </div>
    </section>
  );
};

const ElementTreeView = ({ onChooseElement }: { onChooseElement: (id: string) => void }) => {
  const elementNodes = [
    { id: 'piromancia', x: 14, y: 28, kind: 'base' },
    { id: 'hidromancia', x: 38, y: 28, kind: 'base' },
    { id: 'geomancia', x: 62, y: 30, kind: 'base' },
    { id: 'aeromancia', x: 86, y: 28, kind: 'base' },
    { id: 'eletromancia', x: 14, y: 48, kind: 'branch' },
    { id: 'criromancia', x: 32, y: 46, kind: 'branch' },
    { id: 'magmancia', x: 50, y: 51, kind: 'branch' },
    { id: 'arenomancia', x: 68, y: 47, kind: 'branch' },
    { id: 'metalomancia', x: 86, y: 50, kind: 'branch' },
    { id: 'dinamancia', x: 11, y: 69, kind: 'branch' },
    { id: 'atmomancia', x: 31, y: 65, kind: 'branch' },
    { id: 'fitocinese', x: 50, y: 71, kind: 'branch' },
    { id: 'pneumamancia', x: 69, y: 67, kind: 'branch' },
    { id: 'oximancia', x: 89, y: 70, kind: 'branch' },
    { id: 'plasmamancia', x: 14, y: 89, kind: 'terminal' },
    { id: 'nihilmancia', x: 31, y: 89, kind: 'terminal' },
    { id: 'magnetomancia', x: 86, y: 88, kind: 'terminal' },
    { id: 'eteromancia', x: 62, y: 86, kind: 'terminal' },
  ] as const;
  const connections = [
    ['root', 'piromancia'], ['root', 'hidromancia'], ['root', 'geomancia'], ['root', 'aeromancia'],
    ['piromancia', 'eletromancia'], ['piromancia', 'magmancia'], ['hidromancia', 'eletromancia'], ['hidromancia', 'criromancia'],
    ['geomancia', 'magmancia'], ['geomancia', 'arenomancia'], ['geomancia', 'metalomancia'], ['aeromancia', 'arenomancia'],
    ['aeromancia', 'pneumamancia'], ['eletromancia', 'dinamancia'], ['criromancia', 'atmomancia'], ['magmancia', 'dinamancia'],
    ['arenomancia', 'fitocinese'], ['arenomancia', 'pneumamancia'], ['metalomancia', 'fitocinese'], ['metalomancia', 'magnetomancia'],
    ['dinamancia', 'plasmamancia'], ['atmomancia', 'nihilmancia'], ['fitocinese', 'eteromancia'], ['pneumamancia', 'nihilmancia'],
    ['pneumamancia', 'eteromancia'], ['nihilmancia', 'eteromancia'],
  ] as const;
  const root = { id: 'root', x: 50, y: 9 };
  const getPosition = (id: string) => id === root.id ? root : elementNodes.find((node) => node.id === id)!;

  return (
    <section aria-labelledby="element-tree-heading" className="space-y-6">
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Árvore dos elementos</p>
        <h3 id="element-tree-heading" className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">Escolha um caminho elemental</h3>
        <p className="mx-auto mt-2 max-w-xl text-sm italic text-[#9f9077]">Cada círculo guarda os três volumes de um elemento.</p>
      </div>
      <div className="relative mx-auto aspect-[1.55] w-full max-w-5xl overflow-hidden rounded-sm border border-[#4d3822] bg-[radial-gradient(circle_at_center,rgba(116,78,38,0.2),transparent_58%),#0e0a07] shadow-[inset_0_0_45px_rgba(0,0,0,0.7)] max-[639px]:aspect-[0.78]" aria-label={`Rede de caminhos elementais com ${GRIMORIO_ELEMENT_TREE.flat().length} círculos`}>
        <div className="pointer-events-none absolute inset-[3%] rounded-full border border-[#6b4f2d]/30" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-[12%] rounded-full border border-dashed border-[#8c6b41]/20" aria-hidden="true" />
        <svg className="pointer-events-none absolute inset-0 z-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {connections.map(([from, to]) => {
            const start = getPosition(from);
            const end = getPosition(to);
            return <line key={`${from}-${to}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#9b7748" strokeWidth="0.34" strokeOpacity="0.72" />;
          })}
          {elementNodes.map((node) => <circle key={`junction-${node.id}`} cx={node.x} cy={node.y} r="1.1" fill="#d0a85c" fillOpacity="0.72" />)}
          <circle cx={root.x} cy={root.y} r="3.2" fill="#d8b86b" fillOpacity="0.15" stroke="#c6a15b" strokeOpacity="0.7" strokeWidth="0.35" />
        </svg>
        <div className="absolute left-1/2 top-[9%] z-10 flex size-[5.75rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-2 border-[#d8b86b] bg-[#1a110a] px-1 text-center shadow-[0_0_28px_rgba(216,184,107,0.3)] max-[639px]:size-16">
          <TreePine className="mb-0.5 text-[#d8b86b] max-[639px]:size-4" size={22} aria-hidden="true" />
          <span className="font-cinzel text-[9px] uppercase leading-tight tracking-widest text-[#f1d994] max-[639px]:text-[8px]">Círculo Mágico</span>
          <span className="mt-0.5 text-[8px] italic leading-tight text-[#a88d61] max-[639px]:text-[7px]">Elementar</span>
        </div>
        {elementNodes.map((node) => {
          const element = grimorioElementos.find((item) => item.id === node.id)!;
          const sizeClass = node.kind === 'base' ? 'size-14 sm:size-[6.7rem]' : 'size-[2.875rem] sm:size-[6.4rem]';
          return (
            <button
              key={element.id}
              type="button"
              onClick={() => onChooseElement(element.id)}
              aria-label={`Escolher ${element.name} (${element.subtitle})`}
              title={element.description}
              style={{ borderColor: element.accent, left: `${node.x}%`, top: `${node.y}%` }}
              className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 flex ${sizeClass} flex-col items-center justify-center rounded-full border-2 bg-[#17100b] px-1.5 text-center shadow-[0_0_18px_rgba(0,0,0,0.7)] transition hover:-translate-y-[calc(50%+0.25rem)] hover:bg-[#2a1d12] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] focus-visible:outline-offset-2 max-[639px]:px-0.5`}
            >
              <span className="block max-w-full break-words font-cinzel text-[8px] uppercase leading-[0.95] tracking-wide text-[#eadfc8] sm:text-[10px]">{element.name}</span>
              <span className="mt-1 block max-w-full break-words text-[8px] italic leading-[0.95] text-[#c6a15b] sm:text-[10px]">({element.subtitle})</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};

const TreeView = ({ school, volumes, onChooseVolume }: { school: typeof grimorioAllSchools[number]; volumes: typeof grimorioVolumes; onChooseVolume: (id: string) => void }) => (
  <section aria-labelledby="tree-heading" className="space-y-6"><div className="text-center"><p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Árvore de volumes</p><h3 id="tree-heading" className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">Os tomos de {school.name}</h3><p className="mx-auto mt-2 max-w-xl text-sm italic text-[#9f9077]">Selecione um volume para abrir suas páginas e consultar as magias guardadas.</p></div><div className="relative mx-auto max-w-3xl py-5"><div className="absolute bottom-10 left-1/2 top-10 hidden w-px -translate-x-1/2 bg-[#6b4f2d] sm:block" /><div className="space-y-4">{volumes.map((volume, index) => <div key={volume.id} className={`relative flex items-center gap-3 sm:gap-6 ${index % 2 ? 'sm:flex-row-reverse' : ''}`}><div className="hidden h-px flex-1 bg-[#6b4f2d]/70 sm:block" /><button type="button" onClick={() => onChooseVolume(volume.id)} className="group relative z-10 flex w-full items-center gap-4 border border-[#654b2c] bg-[#1a120c] p-4 text-left shadow-[0_7px_18px_rgba(0,0,0,0.4)] transition hover:border-[#c19a57] hover:bg-[#25190e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] sm:w-[45%]"><span className="flex h-14 w-14 shrink-0 items-center justify-center border border-[#9b7c43] bg-[#2b1d10] font-cinzel text-xl text-[#d7b866]">{volume.number}</span><span><span className="block font-cinzel text-sm uppercase tracking-wider text-[#e6ddc5] group-hover:text-[#f0d68b]">{volume.title}</span><span className="mt-1 block text-xs italic text-[#a88d61]">{volume.subtitle}</span><span className="mt-2 block text-[10px] text-[#8f806a]">{volume.description}</span></span></button><div className="hidden flex-1 sm:block" /></div>)}</div></div></section>
);

interface BookViewProps {
  school: typeof grimorioAllSchools[number]; volume: typeof grimorioVolumes[number]; spells: GrimorioSpell[]; allBookSpells: number; page: number; totalPages: number; onPageChange: (page: number) => void; learnedIds: string[]; canManageCatalog: boolean; canManageVisibility: boolean; hiddenSpellIds: string[]; onOpenSpell: (spell: GrimorioSpell) => void; onToggleLearned: (id: string) => void; onEdit: (spell: GrimorioSpell) => void; onToggleHidden: (id: string) => void; onDelete: (spell: GrimorioSpell) => void;
}

const BookView = ({ school, volume, spells, allBookSpells, page, totalPages, onPageChange, learnedIds, canManageCatalog, canManageVisibility, hiddenSpellIds, onOpenSpell, onToggleLearned, onEdit, onToggleHidden, onDelete }: BookViewProps) => {
  const leftPageSpells = spells.slice(0, 5);
  const rightPageSpells = spells.slice(5, 10);

  const renderPage = (pageSpells: GrimorioSpell[], pageLabel: string, pageNumber: string, headingId: string) => (
    <section aria-labelledby={headingId} className="relative flex min-w-0 flex-col bg-gradient-to-br from-[#e1cc9a] via-[#d4bb84] to-[#b89862] p-4 text-[#382313] sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-2 border border-[#8d6a3e]/50" />
      <header className="relative border-b border-[#80603b]/60 pb-3 text-center">
        <div className="flex items-center justify-center gap-3 text-[#76552e]" aria-hidden="true"><span className="h-px w-10 bg-[#80603b]/60" /><Sparkles size={14} /><span className="h-px w-10 bg-[#80603b]/60" /></div>
        <p className="mt-2 text-[9px] uppercase tracking-[0.28em] text-[#76552e]">{pageLabel}</p>
        <h4 id={headingId} className="mt-1 font-cinzel text-sm uppercase tracking-[0.18em] text-[#382313]">Registro de fórmulas</h4>
      </header>
      <div className="relative mt-4 flex flex-1 flex-col gap-2.5">
        {pageSpells.length ? pageSpells.map((spell) => <SpellCard key={spell.id} spell={spell} learned={learnedIds.includes(spell.id)} hidden={hiddenSpellIds.includes(spell.id)} canManage={canManageCatalog} canToggleHidden={canManageVisibility} onOpen={() => onOpenSpell(spell)} onToggleLearned={() => onToggleLearned(spell.id)} onEdit={() => onEdit(spell)} onToggleHidden={() => onToggleHidden(spell.id)} onDelete={() => onDelete(spell)} />) : <div className="flex min-h-40 flex-1 flex-col items-center justify-center border border-dashed border-[#80603b]/70 px-4 py-8 text-center"><WandSparkles className="text-[#80603b]" size={28} /><p className="mt-3 font-cinzel text-xs uppercase tracking-wider text-[#76552e]">Este volume ainda não possui fórmulas</p><p className="mt-1 text-xs text-[#76552e]/80">As páginas deste tomo estão vazias.</p></div>}
      </div>
      <footer className="relative mt-4 border-t border-[#80603b]/60 pt-2 text-center text-[9px] uppercase tracking-[0.25em] text-[#76552e]">— {pageNumber} —</footer>
    </section>
  );

  return <section aria-labelledby="book-heading" className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.3em] text-[#8c6b41]">Livro aberto · {school.name}</p><h3 id="book-heading" className="mt-1 font-cinzel text-xl uppercase tracking-wider text-[#e6ddc5]">{volume.title}</h3><p className="mt-1 text-sm italic text-[#a79780]">{volume.subtitle} · {volume.description}</p></div><span className="border border-[#5a4225] bg-[#21170e] px-3 py-2 text-xs text-[#c6a15b]">{spells.length} de {allBookSpells} fórmulas</span></div>
    <div className="relative overflow-hidden rounded-sm border-2 border-[#654522] bg-[#2a1b0f] p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.55)] sm:p-3">
      <div className="pointer-events-none absolute inset-1 border border-[#a88d61]/40 sm:inset-2" />
      <div className="relative grid overflow-hidden border border-[#80603b] md:grid-cols-2 md:divide-x md:divide-[#80603b]">
        {renderPage(leftPageSpells, `Página esquerda · fólio ${page}`, String((page - 1) * 2 + 1), 'book-left-heading')}
        {renderPage(rightPageSpells, `Página direita · fólio ${page}`, String((page - 1) * 2 + 2), 'book-right-heading')}
        <div className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-[#5a3d22]/80 shadow-[0_0_8px_rgba(42,25,12,0.7)] md:block" aria-hidden="true" />
      </div>
    </div>
    {allBookSpells > 10 && <nav aria-label="Navegação entre fólios" className="flex flex-wrap items-center justify-center gap-3">
      <GothicButton type="button" variant="secondary" size="xs" width={150} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Fólio anterior</GothicButton>
      <span className="font-cinzel text-[10px] uppercase tracking-widest text-[#c6a15b]">Fólio {page} de {totalPages}</span>
      <GothicButton type="button" variant="secondary" size="xs" width={150} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Próximo fólio</GothicButton>
    </nav>}
  </section>;
};

interface SpellDetailsModalProps {
  spell: GrimorioSpell;
  learned: boolean;
  isMaster: boolean;
  hidden: boolean;
  onClose: () => void;
  onToggleLearned: () => void;
  onEdit: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
}

const SpellDetailsModal = ({ spell, learned, isMaster, hidden, onClose, onToggleLearned, onEdit, onToggleHidden, onDelete }: SpellDetailsModalProps) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const spellSchool = grimorioAllSchools.find((item) => item.id === spell.schoolId);
  const schoolName = spellSchool?.name ?? '-';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050403]/90 p-2 backdrop-blur-sm sm:p-5"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="spell-details-title"
        className="relative flex max-h-[calc(100dvh-0.75rem)] w-full max-w-[820px] flex-col overflow-visible border-2 border-[#76552f] bg-[#b8945c] p-1 text-[#3b2715] shadow-[0_0_50px_rgba(0,0,0,0.95)] sm:max-h-[calc(100dvh-2rem)] sm:p-1.5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(246,220,157,0.44)_0%,transparent_58%),repeating-linear-gradient(115deg,rgba(90,54,23,0.11)_0px,rgba(90,54,23,0.11)_1px,transparent_1px,transparent_7px),repeating-linear-gradient(8deg,rgba(255,244,196,0.12)_0px,rgba(255,244,196,0.12)_2px,transparent_2px,transparent_13px)] opacity-90" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-3 top-5 bottom-6 w-5 bg-[#d7b979] shadow-[2px_2px_5px_rgba(52,31,14,0.4)] [clip-path:polygon(0_0,100%_4%,72%_11%,100%_20%,66%_29%,100%_39%,70%_49%,100%_59%,64%_69%,100%_80%,68%_90%,100%_100%,0_94%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-3 top-6 bottom-5 w-5 bg-[#a7834d] shadow-[-2px_2px_5px_rgba(52,31,14,0.4)] [clip-path:polygon(0_0,100%_5%,28%_14%,100%_24%,32%_35%,100%_47%,26%_59%,100%_70%,30%_82%,100%_92%,26%_100%,0_94%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute -left-2 top-2 bottom-2 z-20 flex w-4 flex-col justify-between rounded-full border border-[#8c6537] bg-[linear-gradient(90deg,#74502b_0%,#d6b575_28%,#f0d99b_52%,#a97b43_76%,#674721_100%)] py-1 shadow-[2px_2px_6px_rgba(38,22,10,0.55)]" aria-hidden="true"><span className="mx-auto h-2.5 w-2.5 rounded-full border border-[#76552f] bg-[#d9b978]" /><span className="mx-auto h-2.5 w-2.5 rounded-full border border-[#76552f] bg-[#8c6537]" /></div>
        <div className="pointer-events-none absolute -right-2 top-2 bottom-2 z-20 flex w-4 flex-col justify-between rounded-full border border-[#76552f] bg-[linear-gradient(90deg,#674721_0%,#a97b43_24%,#f0d99b_48%,#d6b575_72%,#74502b_100%)] py-1 shadow-[-2px_2px_6px_rgba(38,22,10,0.55)]" aria-hidden="true"><span className="mx-auto h-2.5 w-2.5 rounded-full border border-[#76552f] bg-[#d9b978]" /><span className="mx-auto h-2.5 w-2.5 rounded-full border border-[#76552f] bg-[#8c6537]" /></div>
        <div className="pointer-events-none absolute right-2 top-1 z-30 h-10 w-10 bg-[#f0d99b]/55 shadow-[-4px_4px_8px_rgba(52,31,14,0.25)] [clip-path:polygon(0_0,100%_0,100%_100%)]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-1 border border-[#5d4528]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-2 border border-dashed border-[#765b36]/70" aria-hidden="true" />
        <header className="relative mx-0 flex shrink-0 items-center gap-2 border-b border-[#49351f] bg-[#1a110b]/95 px-2.5 py-2 sm:gap-3 sm:px-4 sm:py-2.5">
          <div className="flex h-10 min-w-10 shrink-0 flex-col items-center justify-center border border-[#b18b4e] bg-[#2a1b0f] px-1 text-center shadow-[inset_0_0_0_1px_rgba(241,217,148,0.12)] sm:h-11 sm:min-w-11">
            <span className="text-[8px] uppercase tracking-[0.18em] text-[#a88d61]">Escola</span>
            <span className="mt-0.5 font-cinzel text-[10px] uppercase tracking-wider text-[#f1d994]">{schoolName}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 flex items-center gap-2 text-[9px] uppercase tracking-[0.24em] text-[#a88d61]">
              <BookOpen size={13} /> Grimório · {schoolName}
            </p>
            <h2 id="spell-details-title" className="break-words font-cinzel text-base font-bold uppercase leading-tight tracking-wider text-[#eee3cb] sm:text-lg">
              {spell.name || '-'}
            </h2>
          </div>
          {isMaster && hidden && <span className="border border-[#9b7c43] bg-[#5a4225]/40 px-2 py-1 text-[9px] uppercase tracking-widest text-[#f1d994]">Oculta</span>}
          <div className="flex shrink-0 items-center gap-1.5">
            {isMaster && <>
              <button type="button" onClick={onEdit} aria-label={`Editar ${spell.name || 'magia'}`} title="Editar" className="flex h-9 w-9 items-center justify-center border border-[#5a4225] text-[#a88d61] transition hover:border-[#a88d61] hover:bg-[#3a2c1d]/50 hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]"><Pencil size={16} /></button>
              <button type="button" onClick={onToggleHidden} aria-label={hidden ? `Mostrar ${spell.name || 'magia'}` : `Ocultar ${spell.name || 'magia'}`} title={hidden ? 'Mostrar magia' : 'Ocultar magia'} className="flex h-9 w-9 items-center justify-center border border-[#5a4225] text-[#a88d61] transition hover:border-[#a88d61] hover:bg-[#3a2c1d]/50 hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]">{hidden ? <Eye size={16} /> : <EyeOff size={16} />}</button>
              <button type="button" onClick={onDelete} aria-label={`Excluir ${spell.name || 'magia'}`} title="Excluir" className="flex h-9 w-9 items-center justify-center border border-[#5a4225] text-[#a88d61] transition hover:border-[#a88d61] hover:bg-[#3a2c1d]/50 hover:text-[#f1d994] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]"><Trash2 size={16} /></button>
            </>}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar detalhes da magia"
              title="Fechar"
              className="flex h-9 w-9 items-center justify-center border border-[#5a4225] text-[#a88d61] transition hover:border-[#a88d61] hover:bg-[#3a2c1d]/50 hover:text-[#eee3cb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,rgba(245,221,162,0.48),transparent_52%),repeating-linear-gradient(165deg,rgba(91,57,26,0.1)_0px,rgba(91,57,26,0.1)_1px,transparent_1px,transparent_9px)] p-3 pt-8 sm:p-5 sm:pt-9">
          <div className="pointer-events-none absolute inset-x-8 top-2 flex items-center justify-center gap-2 text-[10px] tracking-[0.55em] text-[#8c6537] opacity-80" aria-hidden="true"><span className="h-px flex-1 bg-[#9c7746]/70" />ᚱ ᚢ ᚾ ᛖ<span className="h-px flex-1 bg-[#9c7746]/70" /></div>
          <div className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[9px] tracking-[0.6em] text-[#8c6537] opacity-70 sm:block" aria-hidden="true">ᛗ ᚨ ᚷ ᛁ ᚲ</div>
          <div className="grid min-w-0 grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(230px,0.72fr)_minmax(0,1.28fr)] lg:gap-6">
            <aside className="order-1 flex min-w-0 flex-col pt-0.5">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-x-2 top-2 bottom-3 bg-[#d3b477]/25 shadow-[0_5px_14px_rgba(0,0,0,0.35)] [clip-path:polygon(5%_0,97%_0,100%_12%,96%_25%,100%_39%,96%_53%,100%_68%,95%_82%,100%_92%,92%_100%,6%_96%,0_84%,4%_69%,0_54%,4%_38%,0_20%)]" aria-hidden="true" />
                <div className="pointer-events-none absolute right-0 top-0 z-30 h-7 w-7 bg-[#e0c88e]/25 [clip-path:polygon(0_0,100%_0,100%_100%)]" aria-hidden="true" />
                <div className="relative border border-[#b18b4e] bg-[#3a2614] p-1 shadow-[0_8px_25px_rgba(0,0,0,0.55)]">
                  <div className="border border-[#765b36] bg-[#0f0a06] p-1">
                    <div className="relative border border-[#c6a15b]/70">
                      <div className="pointer-events-none absolute inset-1 z-10 border border-[#f1d994]/30 sm:inset-2" aria-hidden="true" />
                      <MagicVisual spell={spell} large />
                    </div>
                  </div>
                <div className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l border-t border-[#f1d994]" aria-hidden="true" />
                <div className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r border-t border-[#f1d994]" aria-hidden="true" />
                <div className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b border-l border-[#f1d994]" aria-hidden="true" />
                <div className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b border-r border-[#f1d994]" aria-hidden="true" />
                </div>
              </div>
            </aside>

            <SpellDetails spell={spell} />
          </div>
        </div>

        <footer className="relative flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-[#49351f] bg-[#1a110b]/95 px-2.5 py-2 sm:px-4 sm:py-2.5">
          <p className="text-[9px] uppercase tracking-[0.16em] text-[#80643c]">{learned ? 'Fórmula inscrita no Grimório' : 'Fórmula ainda não aprendida'}</p>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1.5 border border-[#4a351f] px-3 py-2 text-[10px] uppercase tracking-widest text-[#a88d61] transition hover:border-[#80643c] hover:text-[#e6ddc5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994]"
            >
              <X size={14} /> Fechar
            </button>
            <button
              type="button"
              onClick={onToggleLearned}
              aria-pressed={learned}
              className={`flex items-center gap-1.5 border px-3 py-2 text-[10px] uppercase tracking-widest transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#f1d994] ${learned ? 'border-[#a88d61] bg-[#765b36]/40 text-[#f1d994]' : 'border-[#a88d61] bg-[#5a4225]/40 text-[#f1d994] hover:bg-[#765b36]'}`}
            >
              {learned ? <Check size={14} /> : <BookMarked size={14} />}
              {learned ? 'Remover do Grimório' : 'Adicionar ao Grimório'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};

const SpellDetails = ({ spell }: { spell: GrimorioSpell }) => {
  const spellSchool = grimorioAllSchools.find((item) => item.id === spell.schoolId);
  const spellVolume = grimorioVolumes.find((volume) => volume.id === spell.volumeId);
  const hasCustomBookVolume = Object.prototype.hasOwnProperty.call(spell, 'bookVolume');
  const bookVolume = hasCustomBookVolume
    ? (spell.bookVolume === undefined ? undefined : String(spell.bookVolume))
    : spellVolume?.number === 'I' ? '1' : spellVolume?.number === 'II' ? '2' : spellVolume?.number === 'III' ? '3' : undefined;

  return (
  <div className="order-2 min-w-0 space-y-2">
    <section id="spell-overview" className="border-b border-[#49351f] pb-1.5" aria-labelledby="spell-overview-heading">
      <h3 id="spell-overview-heading" className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#4a2b12] sm:text-[10px] sm:tracking-[0.16em]">
        <BookOpen size={12} /> Descrição
      </h3>
      <blockquote className="relative mt-1 border-l-2 border-[#c6a15b] bg-[#1a110b]/85 px-2 py-1.5 text-[10px] italic leading-3.5 text-[#d8cbb1] shadow-[inset_0_0_18px_rgba(0,0,0,0.2)] sm:text-xs sm:leading-4">
        <CircleDot className="absolute -left-[8px] top-2 h-3.5 w-3.5 bg-[#100b07] text-[#c6a15b]" size={12} />
        “{spell.description || '-'}”
      </blockquote>
    </section>

    <section id="spell-technical" className="border-b border-[#49351f] py-1.5" aria-labelledby="spell-stats-heading">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <h3 id="spell-stats-heading" className="flex items-center gap-1.5 font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#4a2b12] sm:text-[10px] sm:tracking-[0.16em]">
          <Sparkles size={12} /> Propriedades Mágicas
        </h3>
        <span className="text-[7px] uppercase tracking-[0.1em] text-[#80643c] sm:text-[8px] sm:tracking-[0.12em]">Dados do registro</span>
      </div>
      <dl className="grid grid-cols-2 gap-1 sm:grid-cols-3">
        <Field label="Escola" value={spellSchool?.name} />
        <Field label="Subcategoria" value={spell.subcategory} />
        <Field label="Livro Vol" value={bookVolume} />
        <Field label="Nível" value={spell.level} />
        <Field label="Consumo" value={spell.consumption} />
        <Field label="Tipo" value={spell.type} />
        <Field label="Dificuldade" value={spell.difficulty} />
        <Field label="Dano" value={spell.damage} />
        <Field label="Duração" value={spell.duration} />
        <Field label="Alcance" value={spell.range} />
        <Field label="Canalização" value={spell.channeling} />
        <Field label="Condição" value={spell.condition} />
      </dl>
    </section>

    <section id="spell-effects" className="border border-[#a88d61]/70 bg-gradient-to-br from-[#2a1b0f] via-[#1c130c] to-[#140c08] p-2 shadow-[inset_0_0_24px_rgba(198,161,91,0.08)]" aria-labelledby="spell-effects-heading">
      <div className="flex items-center gap-1.5 border-b border-[#765b36]/60 pb-1.5">
        <Sparkles size={13} className="text-[#f1d994]" />
        <h3 id="spell-effects-heading" className="font-cinzel text-[9px] uppercase tracking-[0.14em] text-[#f1d994] sm:text-[10px] sm:tracking-[0.16em]">Efeitos mágicos</h3>
        <span className="ml-auto text-[7px] uppercase tracking-[0.1em] text-[#a88d61] sm:text-[8px] sm:tracking-[0.12em]">Campo arcano</span>
      </div>
      <p className="mt-1.5 text-[10px] leading-3.5 text-[#e1d4b8] sm:text-xs sm:leading-4">{spell.magicalEffects || '-'}</p>
    </section>
  </div>
  );
};

export default GrimorioPage;
