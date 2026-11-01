import React, { useState, useEffect, useMemo } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag, Coins, Shield, Swords, Sparkles, Lock,
  Weight, Search, Filter, ArrowRight, ArrowLeft, Plus, Hammer, Layers, Info,
  User, ChevronDown, X, Crown, Flame, Wand2
} from 'lucide-react';
import { MedievalFrame } from '../components/MedievalFrame';
import { InfiniteCategoryScroll } from '../components/InfiniteCategoryScroll';
import { ItemIconVisual } from '../components/ItemIconVisual';
import { ModalDetalhesCompra } from '../components/ModalDetalhesCompra';
import { ModalCriarMercadoria } from '../components/ModalCriarMercadoria';
import { ModalSelecionarComprador } from '../components/ModalSelecionarComprador';
import { GothicButton } from '../components/GothicButton';
import { useAuthorization } from '../hooks/useAuthorization';
import { useFichaStore } from '../store/useFichaStore';
import { CategoriaMercado, MercadoItem, FichaCompleta } from '../types';
import { mercadoService } from '../services/mercadoService';
import { fichaService } from '../services/fichaService';
import { withTimeout } from '../utils/withTimeout';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/Skeleton';

// Marca d'água rúnica sutil gravada no fundo das ranhuras de item
const RuneWatermark: React.FC = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14 opacity-15 filter blur-[0.5px]">
    <path
      d="M 50 20 C 30 20 20 35 20 50 C 20 70 35 80 50 80 C 68 80 78 66 78 50 C 78 36 68 28 54 28 C 42 28 34 36 34 48 C 34 58 42 64 52 64 C 60 64 64 58 64 52 C 64 46 58 44 52 44"
      fill="none"
      stroke="#a39275"
      strokeWidth="7"
      strokeLinecap="round"
    />
  </svg>
);

// Moeda de Ouro clássica estilizada para o mercado
const GoldCoinIcon: React.FC<{ size?: string }> = ({ size = "w-3.5 h-3.5" }) => (
  <div className={`${size} relative inline-flex items-center justify-center flex-shrink-0`}>
    <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-700 border border-amber-900 shadow-sm flex items-center justify-center">
      <div className="w-2/3 h-2/3 rounded-full border border-yellow-200/60 bg-amber-500/40" />
    </div>
  </div>
);

// Mapeamento oficial de subcategorias por categoria principal
export const SUBCATEGORIAS_POR_CATEGORIA: Partial<
  Record<
    CategoriaMercado,
    { id: string; label: string; sigla?: string; desc?: string }[]
  >
> = {
  mercado_armas: [
    { id: 'todas', label: 'Todas as Armas' },
    { id: 'Armas Combate Curto (Cc)', label: 'Combate Curto', sigla: 'Cc', desc: 'Adagas, facas e lâminas curtas' },
    { id: 'Armas Curtas', label: 'Armas Curtas', desc: 'Espadas curtas, machadinhas e maças leves' },
    { id: 'Armas Longas', label: 'Armas Longas', desc: 'Espadas bastardas, sabres e alfanges' },
    { id: 'Viper (V)', label: 'Viper', sigla: 'V', desc: 'Lâminas ágeis e armas de estocada' },
    { id: 'Arma de Haste (AH)', label: 'Arma de Haste', sigla: 'AH', desc: 'Lanças, alabardas e piques' },
    { id: 'Destroyer (D)', label: 'Destroyer', sigla: 'D', desc: 'Montantes, martelos e maças pesadas' },
    { id: 'Armas Kobudo (K)', label: 'Armas Kobudo', sigla: 'K', desc: 'Armas exóticas marciais' },
  ],
  mercado_armaduras: [
    { id: 'todas', label: 'Todas as Armaduras' },
    { id: 'Armaduras Leves', label: 'Armaduras Leves', desc: 'Couro e vestes reforçadas' },
    { id: 'Armaduras Médias', label: 'Armaduras Médias', desc: 'Cotas de malha e peitorais' },
    { id: 'Armaduras Pesadas', label: 'Armaduras Pesadas', desc: 'Placas maciças e arneses reais' },
  ],
  mercado_ld: [
    { id: 'todas', label: 'Todos de Longa Distância' },
    { id: 'Arcos', label: 'Arcos', desc: 'Arcos curtos, longos e recurvos' },
    { id: 'Bestas', label: 'Bestas', desc: 'Bestas mecânicas e de repetição' },
    { id: 'Funda', label: 'Funda', desc: 'Tiras de couro para lançamento de pedras e chumbo' },
    { id: 'Bumerangue', label: 'Bumerangue', desc: 'Armas de arremesso recurvadas com retorno' },
    { id: 'Zarabatana', label: 'Zarabatana', desc: 'Tubos de sopro para dardos de precisão e veneno' },
    { id: 'Estilingue', label: 'Estilingue', desc: 'Atiradeiras com elástico para projéteis' },
  ],
  mercado_progeteis: [
    { id: 'todas', label: 'Todos os Projéteis' },
    { id: 'Flechas', label: 'Flechas', desc: 'Feixes de flechas comuns e de caça' },
    { id: 'Virotes', label: 'Virotes', desc: 'Virotes de perfuração para besta' },
  ],
  mercado_acessorios: [
    { id: 'todas', label: 'Todos os Escudos' },
    { id: 'Broquel', label: 'Broquel', desc: 'Escudo leve de punho para deflexão rápida' },
    { id: 'Rodado', label: 'Rodado', desc: 'Escudo circular com umbo central' },
    { id: 'Targe', label: 'Targe', desc: 'Escudo redondo escocês tradicional reforçado' },
    { id: 'Micênico', label: 'Micênico', desc: 'Escudo em formato de oito de couro cru' },
    { id: 'Greco', label: 'Greco', desc: 'Hoplon clássico côncavo para formações falange' },
    { id: 'Heather', label: 'Heather', desc: 'Escudo aquecedor medieval triangular compacto' },
    { id: 'Torre', label: 'Torre', desc: 'Escudo pesado retangular de proteção maciça' },
    { id: 'Gothic', label: 'Gothic', desc: 'Escudo gótico ornamental com bordo pontiagudo' },
    { id: 'Pipa', label: 'Pipa', desc: 'Escudo amendoado com proteção de pernas para cavalaria' },
    { id: 'Pavise', label: 'Pavise', desc: 'Escudo grande fincado ao solo com suporte' },
    { id: 'Golem', label: 'Golem', desc: 'Escudo maciço esculpido em pedra rúnica' },
    { id: 'Dragão', label: 'Dragão', desc: 'Escudo forjado em escamas e ligas draconianas' },
  ],
  mercado_geral: [
    { id: 'todas', label: 'Todas as Poções' },
    { id: 'Cura', label: 'Cura & Vitalidade', desc: 'Regeneração de vigor e ferimentos' },
    { id: 'Elixires', label: 'Elixires de Batalha', desc: 'Bônus de combate' },
    { id: 'Óleos', label: 'Óleos & Venenos', desc: 'Unguentos para lâminas' },
  ],
  arsenal_epico: [
    { id: 'todas', label: 'Todo o Arsenal Épico' },
    { id: 'Armas Épicas', label: 'Armas Lendárias', desc: 'Lâminas forjadas em mitril' },
    { id: 'Armaduras Épicas', label: 'Armaduras Épicas', desc: 'Proteções com runas antigas' },
    { id: 'Relíquias', label: 'Relíquias & Artefatos', desc: 'Itens raros com magia ancestral' },
  ],
  // Categorias dedicadas do Arsenal Épico
  epico_armas: [
    { id: 'todas', label: 'Todas as Armas Épicas' },
    { id: 'Espadas Ancestrais', label: 'Espadas Ancestrais', desc: 'Lâminas lendárias forjadas no fogo primal' },
    { id: 'Machados Rúnicos', label: 'Machados Rúnicos', desc: 'Armas pesadas com runas de corte profundo' },
    { id: 'Lanças Mitril', label: 'Lanças de Mitril', desc: 'Pontas de perfuração que transpassam aço' },
  ],
  epico_armaduras: [
    { id: 'todas', label: 'Todas as Armaduras Épicas' },
    { id: 'Placas Draconianas', label: 'Placas Draconianas', desc: 'Ligas de escama e adamante' },
    { id: 'Cotas Mitril', label: 'Cotas de Mitril', desc: 'Malha leve quase impenetrável' },
    { id: 'Arneses Sagrados', label: 'Arneses Sagrados', desc: 'Aço abençoado com glória divina' },
  ],
  epico_escudos: [
    { id: 'todas', label: 'Todos os Escudos Épicos' },
    { id: 'Baluartes Rúnicos', label: 'Baluartes Rúnicos', desc: 'Escudos maciços com barreira encantada' },
    { id: 'Paveses Draconianos', label: 'Paveses Draconianos', desc: 'Resistência absoluta a fogo e impacto' },
  ],
  epico_ld: [
    { id: 'todas', label: 'Todo Longa Distância Épico' },
    { id: 'Arcos Élficos', label: 'Arcos Élficos', desc: 'Cordas de cabelo de dríade e alcance supremo' },
    { id: 'Bestas Pesadas', label: 'Bestas de Cerco Portáteis', desc: 'Engrenagens reforçadas em adamante' },
  ],
  // Categorias dedicadas do Mercado Arcano
  arcano_consumiveis: [
    { id: 'todas', label: 'Todos os Consumíveis Arcanos' },
    { id: 'Pergaminhos', label: 'Pergaminhos Rúnicos', desc: 'Incantações seladas em pergaminho' },
    { id: 'Pós Elementais', label: 'Pós Elementais', desc: 'Catalisadores de rituais e reações' },
  ],
  arcano_talismas: [
    { id: 'todas', label: 'Todos os Talismãs' },
    { id: 'Talismãs Astrais', label: 'Talismãs Astrais', desc: 'Amuletos gravados com constelações' },
    { id: 'Pedras Rúnicas', label: 'Pedras Rúnicas', desc: 'Foco de poder canalizado' },
  ],
  arcano_pocoes: [
    { id: 'todas', label: 'Todas as Poções Mágicas' },
    { id: 'Elixires de Mana', label: 'Elixires de Mana', desc: 'Restauração de fluxo arcano' },
    { id: 'Infusões Temporais', label: 'Infusões Especiais', desc: 'Efeitos arcanos contínuos' },
  ],
  arcano_chapeus: [
    { id: 'todas', label: 'Todos os Chapéus Arcanos' },
    { id: 'Chapéus Pontudos', label: 'Chapéus de Mago', desc: 'Feltros encantados que refinam a mente' },
    { id: 'Capuzes Místicos', label: 'Capuzes das Sombras', desc: 'Ocultação de presença e foco' },
  ],
  arcano_vestimentas: [
    { id: 'todas', label: 'Todas as Vestimentas Arcanas' },
    { id: 'Túnicas de Seda Astral', label: 'Túnicas Astrais', desc: 'Tecidos que dissipam calor e frio mágico' },
    { id: 'Mantões de Feiticeiro', label: 'Mantões Rúnicos', desc: 'Proteção contra feitiços hostis' },
  ],
  arcano_cajados: [
    { id: 'todas', label: 'Todos os Cajados & Varinhas' },
    { id: 'Cajados de Cristal', label: 'Cajados Cristalinos', desc: 'Amplificadores de energia elementar' },
    { id: 'Varinhas Rúnicas', label: 'Varinhas de Foco', desc: 'Disparos rápidos de feitiços arcanos' },
  ],
  arcano_aneis: [
    { id: 'todas', label: 'Todos os Anéis Arcanos' },
    { id: 'Anéis de Fogo', label: 'Anéis Elementais', desc: 'Canalizadores de elementos arcanos' },
    { id: 'Anéis de Proteção', label: 'Anéis de Escudo Mágico', desc: 'Barreiras sutis contra energia' },
  ],
  arcano_colares: [
    { id: 'todas', label: 'Todos os Colares Arcanos' },
    { id: 'Amuletos Antigos', label: 'Amuletos Antigos', desc: 'Gemas entalhadas por sábios do passado' },
    { id: 'Pingentes Rúnicos', label: 'Pingentes Sagrados', desc: 'Foco de bênçãos e sabedoria' },
  ],
};

export const MercadoPage: React.FC = () => {
  // O catálogo global é gerido exclusivamente pelo Administrador.
  const { can, tenantId } = useAuthorization();
  const canManageCatalog = can.manageCatalog;

  // Seção Geral do Mercado ('comum' | 'epico' | 'arcano')
  const [secaoMercado, setSecaoMercado] = useState<'comum' | 'epico' | 'arcano'>('comum');

  // Categoria ativa no seletor
  const [activeCategory, setActiveCategory] = useState<CategoriaMercado>('mercado_armas');
  
  // Subcategoria ativa na categoria selecionada
  const [subcategoriaAtiva, setSubcategoriaAtiva] = useState<string>('todas');

  const [erroFicha, setErroFicha] = useState<string | null>(null);
  const [busca, setBusca] = useState<string>('');
  const [buscaDebounced, setBuscaDebounced] = useState<string>('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();

  // Ficha ativa no store global
  const { characterId: storeCharacterId, setCharacterId: setStoreCharacterId } = useFichaStore();
  const [personagemId, setPersonagemId] = useState<string>(() => storeCharacterId);
  const [listaPersonagens, setListaPersonagens] = useState<Array<{ id: string; nome: string; raca?: string; nivel?: number; imagem_url?: string; dinheiro: number }>>([]);
  const [isModalCompradorOpen, setIsModalCompradorOpen] = useState<boolean>(false);

  // Estado da Ficha do Personagem Selecionado
  const [ficha, setFicha] = useState<FichaCompleta | null>(null);
  const [loadingFicha, setLoadingFicha] = useState<boolean>(true);

  // Modal 3.1: Detalhes e Compra
  const [selectedItem, setSelectedItem] = useState<MercadoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Modal 3.2: Criar/Editar Mercadoria (Acesso exclusivo Administrador)
  const [isModalCriarOpen, setIsModalCriarOpen] = useState<boolean>(false);
  const [itemParaEdicao, setItemParaEdicao] = useState<MercadoItem | null>(null);

  // Permissão para Arsenal Épico.
  const temPermissaoEpica = can.accessEpicMarket(ficha);

  // Carregar lista de personagens disponíveis
  const carregarListaPersonagens = async () => {
    try {
      const lista = await withTimeout(fichaService.getListaPersonagens());
      setListaPersonagens(lista);
      if (lista.length > 0 && !lista.some((p) => p.id === personagemId)) {
        setPersonagemId(lista[0].id);
      }
    } catch (e) {
      console.error('Erro ao carregar lista de personagens', e);
      setErroFicha('Não foi possível carregar a lista de personagens compradores.');
    }
  };

  // Carregar dados da ficha do personagem selecionado para consultar saldo, peso e inventário
  const carregarFicha = async (idParaCarregar = personagemId) => {
    if (!idParaCarregar) {
      setFicha(null);
      setErroFicha(null);
      setLoadingFicha(false);
      return;
    }
    try {
      setLoadingFicha(true);
      setErroFicha(null);
      const data = await withTimeout(fichaService.getFicha(idParaCarregar));
      setFicha(data);
    } catch (e) {
      console.error('Erro ao carregar ficha para o mercado', e);
      setFicha(null);
      setErroFicha(
        e instanceof Error ? e.message : 'Não foi possível carregar a bolsa do personagem.'
      );
    } finally {
      setLoadingFicha(false);
    }
  };

  useEffect(() => {
    carregarListaPersonagens();
  }, []);

  useEffect(() => {
    carregarFicha(personagemId);
  }, [personagemId]);

  useEffect(() => {
    const temporizador = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(temporizador);
  }, [busca]);

  useEffect(() => {
    setPage(1);
  }, [activeCategory, subcategoriaAtiva, busca]);

  const {
    data: paginaMercado,
    isLoading: carregandoItens,
    isFetching: buscandoItens,
    isError: erroItens,
    error: erroConsulta,
    refetch: recarregarItens,
    isPlaceholderData,
  } = useQuery({
    queryKey: ['mercado', { categoria: activeCategory, subcategoria: subcategoriaAtiva, busca: buscaDebounced, page, pageSize }],
    queryFn: () => withTimeout(mercadoService.listarItens({
      categoria: activeCategory,
      subcategoria: subcategoriaAtiva,
      busca: buscaDebounced,
      page,
      pageSize,
    })),
    placeholderData: keepPreviousData,
  });
  const itens = paginaMercado?.itens ?? [];
  const totalItens = paginaMercado?.total ?? 0;
  const totalPaginas = Math.ceil(totalItens / pageSize);

  useEffect(() => {
    if (!isPlaceholderData && !carregandoItens && totalPaginas > 0 && page > totalPaginas) {
      setPage(totalPaginas);
    }
  }, [isPlaceholderData, carregandoItens, totalPaginas, page]);

  // Mapeamento de abas por Seção Principal do Mercado
  const TABS_POR_SECAO: Record<'comum' | 'epico' | 'arcano', {
    id: CategoriaMercado;
    label: string;
    icon: React.ReactNode;
    isEpic?: boolean;
    descricao: string;
  }[]> = {
    comum: [
      {
        id: 'mercado_armas',
        label: 'Armas',
        descricao: 'Lâminas curtas, longas, armas de haste, viper e armas pesadas.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 32 4 L 44 16 L 20 40 L 14 34 Z M 44 4 L 32 4 L 44 16 Z M 16 32 L 8 40 L 10 42 L 6 46 L 2 42 L 6 38 L 8 40 L 16 32 Z" />
          </svg>
        ),
      },
      {
        id: 'mercado_armaduras',
        label: 'Armaduras',
        descricao: 'Couros fervidos, cotas de malha e armaduras completas de placas.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 14 10 L 24 14 L 34 10 L 38 18 L 34 38 L 24 44 L 14 38 L 10 18 Z M 20 18 L 24 32 L 28 18 Z" />
          </svg>
        ),
      },
      {
        id: 'mercado_ld',
        label: 'Longa Dist.',
        descricao: 'Arcos longos, recurvos, bestas mecânicas e armas de cerco.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 12 8 Q 38 24 12 40 L 14 42 Q 42 24 14 6 Z M 14 8 L 14 40 M 14 24 L 30 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        id: 'mercado_progeteis',
        label: 'Projéteis',
        descricao: 'Feixes de flechas, virotes temperados e munições especiais.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 36 8 L 40 12 L 18 34 L 12 36 L 14 30 Z M 40 8 L 34 10 L 38 14 Z M 14 34 L 8 40 L 10 42 L 8 44 L 4 40 L 6 38 L 8 40 Z" />
          </svg>
        ),
      },
      {
        id: 'mercado_acessorios',
        label: 'Escudos',
        descricao: 'Broquéis, escudos de gota, escudos medievais e pavês de infantaria.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 12 10 L 36 10 L 36 26 C 36 36 24 42 24 42 C 24 42 12 36 12 26 Z M 24 16 L 30 26 L 24 34 L 18 26 Z" />
          </svg>
        ),
      },
      {
        id: 'mercado_geral',
        label: 'Poções',
        descricao: 'Poções de cura, elixires alquímicos de combate e óleos de lâmina.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <rect x="20" y="6" width="8" height="6" rx="1" />
            <circle cx="24" cy="28" r="14" />
            <circle cx="20" cy="24" r="3" fill="#ffffff" opacity="0.6" />
          </svg>
        ),
      },
    ],
    epico: [
      {
        id: 'epico_armas',
        label: 'Armas',
        descricao: 'Lâminas ancestrais, espadas lendárias e machados míticos de grande poder.',
        isEpic: true,
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 32 4 L 44 16 L 20 40 L 14 34 Z M 44 4 L 32 4 L 44 16 Z M 16 32 L 8 40 L 10 42 L 6 46 L 2 42 L 6 38 L 8 40 L 16 32 Z" />
          </svg>
        ),
      },
      {
        id: 'epico_armaduras',
        label: 'Armaduras',
        descricao: 'Arneses sagrados, cotas de mitril e couraças esculpidas em escamas de dragão.',
        isEpic: true,
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 14 10 L 24 14 L 34 10 L 38 18 L 34 38 L 24 44 L 14 38 L 10 18 Z M 20 18 L 24 32 L 28 18 Z" />
          </svg>
        ),
      },
      {
        id: 'epico_escudos',
        label: 'Escudos',
        descricao: 'Baluartes rúnicos imbuídos com bênçãos defensivas impenetráveis.',
        isEpic: true,
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 12 10 L 36 10 L 36 26 C 36 36 24 42 24 42 C 24 42 12 36 12 26 Z M 24 16 L 30 26 L 24 34 L 18 26 Z" />
          </svg>
        ),
      },
      {
        id: 'epico_ld',
        label: 'Longa Distância',
        descricao: 'Arcos élficos do coração da floresta e bestas mecânicas de adamante.',
        isEpic: true,
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 12 8 Q 38 24 12 40 L 14 42 Q 42 24 14 6 Z M 14 8 L 14 40 M 14 24 L 30 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
    arcano: [
      {
        id: 'arcano_consumiveis',
        label: 'Consumíveis',
        descricao: 'Pergaminhos arcanos, incensos rituais e catalisadores elementares.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 12 12 C 12 8 16 6 24 6 C 32 6 36 8 36 12 L 36 36 C 36 40 32 42 24 42 C 16 42 12 40 12 36 Z M 16 16 L 32 16 M 16 22 L 32 22 M 16 28 L 26 28" stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        ),
      },
      {
        id: 'arcano_talismas',
        label: 'Talismãs',
        descricao: 'Pedras rúnicas ancestrais, talismãs astrais e amuletos de foco cósmico.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <polygon points="24,6 38,18 32,38 16,38 10,18" stroke="currentColor" strokeWidth="2" fill="none" />
            <circle cx="24" cy="24" r="5" fill="currentColor" />
          </svg>
        ),
      },
      {
        id: 'arcano_pocoes',
        label: 'Poções Mágicas',
        descricao: 'Frascos etéreos contendo essências elementais, mana condensada e infusões temporais.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <rect x="20" y="6" width="8" height="6" rx="1" />
            <circle cx="24" cy="28" r="14" />
            <circle cx="20" cy="24" r="3" fill="#ffffff" opacity="0.6" />
          </svg>
        ),
      },
      {
        id: 'arcano_chapeus',
        label: 'Chapéus',
        descricao: 'Chapéus cônicos ornamentados, capuzes da névoa e tiaras de alta concentracão arcana.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 24 6 L 12 34 L 36 34 Z M 6 36 C 14 32 34 32 42 36 C 34 40 14 40 6 36 Z" />
          </svg>
        ),
      },
      {
        id: 'arcano_vestimentas',
        label: 'Vestimentas',
        descricao: 'Túnicas tecidas em seda estelar, mantos de arcanista e roupagens que repelem feitiços.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 18 8 L 24 14 L 30 8 L 38 16 L 32 22 L 34 42 L 14 42 L 16 22 L 10 16 Z" />
          </svg>
        ),
      },
      {
        id: 'arcano_cajados',
        label: 'Cajados',
        descricao: 'Báculos canalizadores, varinhas de cristal puro e bastões de feitiçaria primal.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <line x1="14" y1="44" x2="32" y2="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
            <circle cx="34" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
            <circle cx="34" cy="12" r="2.5" fill="currentColor" />
          </svg>
        ),
      },
      {
        id: 'arcano_aneis',
        label: 'Anéis',
        descricao: 'Aros dourados e prateados cravados com gemas e inscrições de amplificação mágica.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <circle cx="24" cy="28" r="14" fill="none" stroke="currentColor" strokeWidth="3" />
            <polygon points="24,6 29,14 19,14" fill="currentColor" />
          </svg>
        ),
      },
      {
        id: 'arcano_colares',
        label: 'Colares',
        descricao: 'Correntes nobres de mitril e ouro com relicários, camafeus e pedras filosofais.',
        icon: (
          <svg viewBox="0 0 48 48" className="w-6 h-6 fill-current">
            <path d="M 12 10 Q 24 28 36 10" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <polygon points="24,24 29,32 24,38 19,32" fill="currentColor" />
          </svg>
        ),
      },
    ],
  };

  // As tabs exibidas dependem da seção selecionada no mercado
  const tabsConfig = useMemo(() => {
    return TABS_POR_SECAO[secaoMercado] || TABS_POR_SECAO.comum;
  }, [secaoMercado]);

  const saldoAtual = ficha?.recursos?.dinheiro ?? 0;
  const cargaAtual = ficha?.recursos?.carga_total_peso ?? 0;

  // Abertura do Modal 3.1
  const handleAbrirDetalhes = (item: MercadoItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  // Confirmação de compra no modal
  const handleConfirmarCompra = async (item: MercadoItem, quantidade: number) => {
    const res = await mercadoService.efetuarCompra({
      fichaId: personagemId,
      item,
      quantidade,
    });
    // Atualiza o saldo e peso imediatamente na UI para a ficha selecionada
    await carregarFicha(personagemId);
    await carregarListaPersonagens();

    // Sincroniza ativamente com o useFichaStore se for o personagem ativo
    const store = useFichaStore.getState();
    if (store.characterId === personagemId) {
      await store.loadFicha(personagemId);
    }
  };

  // Abertura do Modal de Edição pelo Administrador
  const handleAbrirEdicao = (item: MercadoItem) => {
    setItemParaEdicao(item);
    setIsModalOpen(false);
    setIsModalCriarOpen(true);
  };

  // Retorno da edição para a visualização dos detalhes do item
  const handleVoltarParaDetalhes = () => {
    setIsModalCriarOpen(false);
    setItemParaEdicao(null);
    setIsModalOpen(true);
  };

  // Exclusão de mercadoria pelo Administrador
  const handleExcluirMercadoria = async (item: MercadoItem) => {
    await mercadoService.excluirMercadoria(item.id);
    await queryClient.invalidateQueries({ queryKey: ['mercado'] });
  };

  // Cadastro ou Atualização de mercadoria pelo Administrador
  const handleItemSalvo = async (itemSalvo: MercadoItem) => {
    if (itemParaEdicao) {
      await mercadoService.atualizarMercadoria(itemSalvo);
    } else {
      await mercadoService.criarMercadoria(itemSalvo);
    }
    setItemParaEdicao(null);
    await queryClient.invalidateQueries({ queryKey: ['mercado'] });
  };

  const categoriaAtivaInfo = tabsConfig.find((t) => t.id === activeCategory);
  const subcategoriasAtuais = SUBCATEGORIAS_POR_CATEGORIA[activeCategory] || [];

  // Modo de estilo e estética ('default' | 'epico' | 'arcano')
  const themeMode: 'default' | 'epico' | 'arcano' = useMemo(() => {
    if (secaoMercado === 'epico' || activeCategory.startsWith('epico_') || activeCategory === 'arsenal_epico') {
      return 'epico';
    }
    if (secaoMercado === 'arcano' || activeCategory.startsWith('arcano_')) {
      return 'arcano';
    }
    return 'default';
  }, [secaoMercado, activeCategory]);

  return (
    <div id="page-mercado" className="w-full max-w-6xl mx-auto space-y-6 select-none">
      
      {/* ========================================================================= */}
      {/* MERCADO GLOBAL & ARSENAL - LAYOUT ATUALIZADO */}
      {/* ========================================================================= */}
      <MedievalFrame
        title={
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {themeMode === 'epico' ? (
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-[#fbbf24] shrink-0 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            ) : themeMode === 'arcano' ? (
              <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 text-[#c084fc] shrink-0 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
            ) : (
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[#c5a059] shrink-0" />
            )}
            <span className="truncate">
              {secaoMercado === 'epico' 
                ? 'Arsenal Épico & Relíquias' 
                : secaoMercado === 'arcano' 
                ? 'Mercado Arcano & Misticismo' 
                : 'Mercado Global & Provisões'}
            </span>
          </div>
        }
        subtitle={
          secaoMercado === 'epico'
            ? 'Armamentos lendários, forja mitril e relíquias ancestrais de alto prestígio'
            : secaoMercado === 'arcano'
            ? 'Consumíveis mágicos, talismãs celestes, poções etéreas e artefatos de poder arcano'
            : 'Arsenal, provisões e equipamentos marciais'
        }
        headerRight={
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Botão de Seleção de Personagem Comprador (Abre Modal Elegante) */}
            {tenantId && <button
              id="btn-abrir-modal-comprador"
              type="button"
              onClick={() => setIsModalCompradorOpen(true)}
              className="flex items-center justify-between gap-1.5 sm:gap-2.5 h-10 bg-[#120f0d]/95 hover:bg-[#1c140d] border border-[#5a4225] hover:border-[#c5a059] px-2.5 sm:px-3 rounded-xs shadow-[0_2px_8px_rgba(0,0,0,0.8)] transition-all cursor-pointer text-left group min-w-0"
              title="Clique para selecionar o personagem comprador"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {ficha?.identidade?.imagem_url ? (
                  <img
                    src={ficha.identidade.imagem_url}
                    alt={ficha.identidade.nome_personagem}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-xs object-cover border border-[#8c6b41] group-hover:border-[#c5a059] shrink-0 transition-colors"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-xs bg-[#24170d] border border-[#5a4225] group-hover:border-[#c5a059] flex items-center justify-center shrink-0 text-[#c5a059] transition-colors">
                    <User size={13} />
                  </div>
                )}

                <div className="min-w-0">
                  <span className="text-[7.5px] sm:text-[8px] text-[#8c6b41] uppercase tracking-wider block font-cinzel leading-none mb-0.5">
                    Comprador
                  </span>
                  <span className="text-[#f2dfa8] group-hover:text-[#fff] font-cinzel font-bold text-[11px] sm:text-xs truncate block leading-tight transition-colors">
                    {loadingFicha ? 'Carregando…' : ficha?.identidade?.nome_personagem || 'Selecionar'}
                  </span>
                </div>
              </div>

              <Search size={13} className="text-[#8c6b41] group-hover:text-[#c5a059] shrink-0 ml-0.5 transition-colors" />
            </button>}

            {/* Saldo Atual do Personagem (Bolsa) */}
            {tenantId && <div className="flex items-center justify-center sm:justify-start gap-2 h-10 bg-[#120f0d]/95 border border-[#5a4225] px-2.5 sm:px-3 rounded-xs shadow-[0_0_10px_rgba(0,0,0,0.8)] min-w-0">
              <Coins size={15} className="text-[#d4af37] shrink-0" />
              <div className="text-left flex flex-col justify-center leading-none min-w-0">
                <span className="text-[7.5px] sm:text-[8px] text-[#8c6b41] uppercase tracking-wider block font-cinzel mb-0.5">Bolsa</span>
                <span className="text-[#f2dfa8] font-mono font-bold text-[11px] sm:text-sm tracking-wider truncate">
                  {saldoAtual} <span className="text-[8.5px] sm:text-[9px] font-cinzel text-[#8c6b41]">Moedas</span>
                </span>
              </div>
            </div>}

            {/* Botão de Criar Mercadoria (Exclusivo para o Administrador) */}
            {canManageCatalog && (
              <div className="col-span-2 sm:col-span-1 sm:w-auto">
                <GothicButton
                  id="btn-criar-mercadoria"
                  onClick={() => {
                    setItemParaEdicao(null);
                    setIsModalCriarOpen(true);
                  }}
                  variant="primary"
                  size="sm"
                  width={150}
                  height={40}
                  className="w-full sm:w-[150px] shrink-0 h-10"
                >
                  <Hammer size={14} className="mr-1 text-[#d4af37]" />
                  Criar Mercadoria
                </GothicButton>
              </div>
            )}

          </div>
        }
      >
        <div className="space-y-4 pt-1 sm:pt-2 pb-6 px-0.5 sm:px-3">
          
          {erroFicha && (
            <ErrorState
              title="Falha ao carregar a bolsa do comprador"
              description={erroFicha}
              className="py-6"
              onRetry={() => {
                void carregarListaPersonagens();
                void carregarFicha(personagemId);
              }}
            />
          )}

          {/* ========================================================================= */}
          {/* SELETORES DAS GRANDES ABAS DO MERCADO (MERCADO COMUM, ARSENAL ÉPICO, MERCADO ARCANO) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-3 gap-1 sm:gap-2.5 p-1 sm:p-1.5 bg-[#090705]/95 border border-[#3e2c1a] rounded-xs shadow-[inset_0_2px_6px_rgba(0,0,0,0.9)] w-full">
            {/* Aba 1: Mercado Comum */}
            <button
              type="button"
              id="tab-secao-comum"
              onClick={() => {
                setSecaoMercado('comum');
                setActiveCategory('mercado_armas');
                setSubcategoriaAtiva('todas');
                setBusca('');
              }}
              className={`relative px-1 sm:px-4 py-2 rounded-xs border transition-all text-[10px] sm:text-xs font-cinzel tracking-wider uppercase font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer w-full text-center ${
                secaoMercado === 'comum'
                  ? 'bg-gradient-to-b from-[#2a1d12] via-[#1a120b] to-[#100b07] text-[#f2dfa8] border-[#c5a059] shadow-[0_0_12px_rgba(197,160,89,0.35)]'
                  : 'bg-[#120d09]/80 text-[#8c6b41] border-[#3e2c1a] hover:text-[#e6ddc5] hover:border-[#6a4f2c]'
              }`}
            >
              <ShoppingBag size={13} className={`shrink-0 ${secaoMercado === 'comum' ? 'text-[#f2dfa8]' : 'text-[#8c6b41]'}`} />
              <span className="truncate">
                <span className="hidden sm:inline">Mercado </span>Comum
              </span>
              {secaoMercado === 'comum' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-0.5 bg-[#c5a059] shadow-[0_0_4px_#c5a059]" />
              )}
            </button>

            {/* Aba 2: Arsenal Épico */}
            <button
              type="button"
              id="tab-secao-epico"
              onClick={() => {
                setSecaoMercado('epico');
                setActiveCategory('epico_armas');
                setSubcategoriaAtiva('todas');
                setBusca('');
              }}
              className={`relative px-1 sm:px-4 py-2 rounded-xs border transition-all text-[10px] sm:text-xs font-cinzel tracking-wider uppercase font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer w-full text-center ${
                secaoMercado === 'epico'
                  ? 'bg-gradient-to-b from-[#3a2810] via-[#221606] to-[#120b02] text-[#fef08a] border-[#eab308] shadow-[0_0_15px_rgba(234,179,8,0.45)]'
                  : 'bg-[#120d09]/80 text-[#ca8a04] border-[#5a421a] hover:text-[#fde047] hover:border-[#a16207]'
              }`}
            >
              <Crown size={13} className={`shrink-0 ${secaoMercado === 'epico' ? 'text-[#facc15]' : 'text-[#a16207]'}`} />
              <span className="truncate">
                <span className="hidden sm:inline">Arsenal </span>Épico
              </span>
              {secaoMercado === 'epico' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-0.5 bg-[#eab308] shadow-[0_0_6px_#eab308]" />
              )}
            </button>

            {/* Aba 3: Mercado Arcano */}
            <button
              type="button"
              id="tab-secao-arcano"
              onClick={() => {
                setSecaoMercado('arcano');
                setActiveCategory('arcano_consumiveis');
                setSubcategoriaAtiva('todas');
                setBusca('');
              }}
              className={`relative px-1 sm:px-4 py-2 rounded-xs border transition-all text-[10px] sm:text-xs font-cinzel tracking-wider uppercase font-bold flex items-center justify-center gap-1 sm:gap-2 cursor-pointer w-full text-center ${
                secaoMercado === 'arcano'
                  ? 'bg-gradient-to-b from-[#2e1845] via-[#1a0c2a] to-[#0f0619] text-[#e9d5ff] border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.45)]'
                  : 'bg-[#120d09]/80 text-[#a855f7] border-[#4a2468] hover:text-[#f3e8ff] hover:border-[#9333ea]'
              }`}
            >
              <Wand2 size={13} className={`shrink-0 ${secaoMercado === 'arcano' ? 'text-[#c084fc]' : 'text-[#7e22ce]'}`} />
              <span className="truncate">
                <span className="hidden sm:inline">Mercado </span>Arcano
              </span>
              {secaoMercado === 'arcano' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 sm:w-8 h-0.5 bg-[#a855f7] shadow-[0_0_6px_#a855f7]" />
              )}
            </button>
          </div>

          {/* BARRA SUPERIOR DE CATEGORIAS: ROLAGEM INFINITA */}
          <div className="w-full">
            <InfiniteCategoryScroll
              tabs={tabsConfig}
              activeId={activeCategory}
              themeMode={themeMode}
              onSelect={(catId) => {
                setActiveCategory(catId as CategoriaMercado);
                setSubcategoriaAtiva('todas');
                setBusca('');
              }}
            />
          </div>

          {/* ========================================================================= */}
          {/* SUBCATEGORIAS VISÍVEIS DA CATEGORIA SELECIONADA */}
          {/* ========================================================================= */}
          {subcategoriasAtuais.length > 0 && (
            <div className="space-y-2 bg-[#0c0806]/90 border border-[#5a4225] p-2.5 sm:p-3.5 rounded-xs shadow-[0_0_15px_rgba(0,0,0,0.7)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-[#a88d61] shrink-0" />
                  <span className="text-[11px] sm:text-xs font-cinzel uppercase tracking-wider text-[#e6ddc5] font-bold truncate">
                    Subcategorias &bull; {categoriaAtivaInfo?.label}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-[#8c6b41] font-serif italic">
                  Filtre por especialidade de combate
                </span>
              </div>

              {/* Barra de Seletores de Subcategoria - Suporte a scroll horizontal suave no mobile */}
              <div className="flex sm:flex-wrap items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar pb-1 sm:pb-0 touch-pan-x">
                {subcategoriasAtuais.map((sub) => {
                  const isSelected = subcategoriaAtiva === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      id={`subcat-btn-${sub.id.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => setSubcategoriaAtiva(sub.id)}
                      className={`shrink-0 px-2.5 sm:px-3 py-1.5 rounded-xs border transition-all text-[11px] sm:text-xs font-cinzel cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#3a2818] border-[#8c6b41] text-[#f2dfa8] shadow-[0_0_10px_rgba(140,107,65,0.35)] font-bold'
                          : 'bg-[#120f0d]/90 border-[#5a4225] text-[#8c6b41] hover:text-[#e6ddc5] hover:border-[#8c6b41]'
                      }`}
                    >
                      <span className="whitespace-nowrap">{sub.label}</span>
                      {sub.sigla && (
                        <span className={`text-[9px] font-mono px-1 py-0.2 rounded-xs border ${
                          isSelected 
                            ? 'bg-[#1a140e] border-[#8c6b41] text-[#f2dfa8]' 
                            : 'bg-[#1a140e] border-[#3a2818] text-[#8c6b41]'
                        }`}>
                          {sub.sigla}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

            {/* BARRA DE PESQUISA & STATUS DO CATÁLOGO DA CATEGORIA */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 bg-[#0c0806]/90 border border-[#5a4225] px-3 sm:px-4 py-2.5 rounded-xs shadow-[0_0_15px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#a88d61] font-cinzel uppercase tracking-wider flex-wrap">
                <span className="w-2 h-2 rounded-full bg-[#8c6b41] animate-pulse shrink-0" />
                <span>
                  Catálogo: <strong className="text-[#f2dfa8]">{categoriaAtivaInfo?.label}</strong>
                  {subcategoriaAtiva !== 'todas' && (
                    <span className="text-[#dcd1ba]"> &bull; {subcategoriasAtuais.find(s => s.id === subcategoriaAtiva)?.label}</span>
                  )}
                </span>
                <span className="text-[#8c6b41] font-serif text-[10px] sm:text-xs italic">({totalItens} itens)</span>
                {buscandoItens && <span className="text-[10px] text-[#a88d61] font-serif italic">Carregando…</span>}
              </div>

              {/* Input de Busca */}
              <div className="relative w-full sm:w-64">
                <Search size={14} className="text-[#8c6b41] absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Pesquisar por nome, material..."
                  className="w-full bg-[#120f0d]/90 border border-[#5a4225] focus:border-[#a88d61] text-[#e6ddc5] placeholder-[#8c6b41] text-xs font-serif pl-8 pr-3 py-1.5 sm:py-1.5 rounded-xs outline-none transition-all"
                />
              </div>
            </div>

            {/* LISTAGEM DE ITENS DA CATEGORIA */}
            {carregandoItens ? (
              <LoadingState variant="table" label="Consultando registros do arsenal…" className="py-10" />
            ) : erroItens ? (
              <ErrorState
                title="Falha ao consultar o catálogo"
                description={erroConsulta instanceof Error ? erroConsulta.message : 'Não foi possível carregar o catálogo do mercado.'}
                onRetry={() => { void recarregarItens(); }}
              />
            ) : totalItens === 0 ? (
              <EmptyState
                title="Nenhum item encontrado nesta subcategoria."
                description={'Tente selecionar "Todas as Armas" ou cadastrar uma nova mercadoria através do botão do Administrador.'}
                className="py-16"
              />
            ) : (
              <div className="space-y-2 bg-[#0c0806]/85 p-1.5 sm:p-3 rounded-xs border border-[#5a4225] shadow-[0_0_20px_rgba(0,0,0,0.8)]">
                {/* CABEÇALHO DA TABELA DE ITENS - Visível apenas a partir de telas sm/md para não poluir o mobile */}
                <div className="hidden sm:grid grid-cols-12 text-[10px] sm:text-xs font-cinzel text-[#8c6b41] px-3 py-2 border-b border-[#3a2c1d] uppercase tracking-wider text-center items-center font-bold">
                  <div className="col-span-1 text-left">Item</div>
                  <div className="col-span-5 md:col-span-4 text-left">Nome</div>
                  <div className="col-span-3 sm:col-span-2 text-center">Preço</div>
                  <div className="hidden md:block col-span-2 text-center">Propriedades</div>
                  <div className="hidden lg:block col-span-1 text-center">Peso</div>
                  <div className="col-span-1 text-center">Info</div>
                  <div className="col-span-2 md:col-span-1 text-right pr-1">Ação</div>
                </div>

                {/* TABELA / LISTA DE LINHAS METÁLICAS */}
                <div className="space-y-2">
                  {itens.map((item) => {
                    const bloqueadoEpico = item.is_epico && !temPermissaoEpica;

                    return (
                      <div
                        key={item.id}
                        id={`card-item-${item.id}`}
                        className={`relative rounded-xs p-1.5 flex flex-col sm:grid sm:grid-cols-12 items-stretch sm:items-center gap-1.5 transition-all ${
                          bloqueadoEpico
                            ? 'opacity-60 cursor-not-allowed'
                            : 'hover:brightness-105 shadow-[0_4px_14px_rgba(0,0,0,0.7)]'
                        }`}
                        style={{
                          background: 'linear-gradient(180deg, #323b44 0%, #222930 15%, #151a1e 50%, #0d1013 85%, #07090b 100%)',
                          borderTop: '1px solid #546473',
                          borderBottom: '1.5px solid #050709',
                          borderLeft: '1px solid #283038',
                          borderRight: '1px solid #283038',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.12)',
                        }}
                      >
                        {/* PARTE PRINCIPAL: ÍCONE + DADOS (No mobile é uma linha horizontal unificada) */}
                        <div className="flex items-center gap-2 sm:contents w-full">
                          {/* 1. ÍCONE DO ITEM COM MOLDURA ORNAMENTAL E MEDALHÃO TIER */}
                          <div className="sm:col-span-1 flex items-center justify-start shrink-0">
                            <div
                              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xs flex items-center justify-center overflow-hidden shrink-0"
                              style={{
                                background: 'linear-gradient(135deg, #3a4550 0%, #20272f 50%, #11151a 100%)',
                                border: '1.5px solid #526373',
                                boxShadow: '0 3px 8px rgba(0,0,0,0.85), inset 0 1px 1px rgba(255,255,255,0.18)',
                                padding: '2px',
                              }}
                            >
                              {/* Moldura ornamental interna com filete dourado/latão envelhecido */}
                              <div
                                className="relative w-full h-full rounded-xs overflow-hidden flex items-center justify-center"
                                style={{
                                  border: '1px solid #8c6b41',
                                  boxShadow: 'inset 0 0 6px rgba(0,0,0,0.9), 0 0 0 1px #1a140e',
                                  background: 'radial-gradient(circle at center, #232c35 0%, #0d1115 100%)',
                                }}
                              >
                                {/* Marca d'água rúnica se for ícone SVG padrão */}
                                {!item.imagem_url && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
                                    <RuneWatermark />
                                  </div>
                                )}

                                {/* Imagem do Item (preenche a moldura com nitidez se tiver fundo) */}
                                <ItemIconVisual
                                  type={item.icone_tipo}
                                  imageUrl={item.imagem_url}
                                  className="w-full h-full object-cover z-10"
                                />

                                {/* Vinheta interna suave sobre a imagem para acabamento gótico lapidado */}
                                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_5px_rgba(0,0,0,0.7)] z-15" />

                                {/* Cantoneiras ornamentais góticas douradas */}
                                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-[#f2dfa8]/80 pointer-events-none z-20" />
                                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-[#f2dfa8]/80 pointer-events-none z-20" />
                                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-[#f2dfa8]/80 pointer-events-none z-20" />
                              </div>

                              {/* Medalhão metálico circular de Tier no canto superior esquerdo */}
                              <div
                                className="absolute -top-0.5 -left-0.5 z-30 w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-bold font-cinzel text-[#fde68a]"
                                style={{
                                  background: 'linear-gradient(180deg, #3a4652 0%, #151c22 100%)',
                                  border: '1px solid #c5a059',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.25)',
                                }}
                                title={item.is_epico ? 'Nível Épico' : 'Nível I'}
                              >
                                {item.is_epico ? '★' : 'I'}
                              </div>

                              {/* Overlay de Bloqueio se restrito */}
                              {bloqueadoEpico && (
                                <div className="absolute inset-0 bg-black/85 z-40 rounded-xs flex items-center justify-center border border-[#3d4955] backdrop-blur-[1px]">
                                  <Lock size={14} className="text-[#8c6b41]" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 2. PLACA INTERNA DE MADEIRA NOBRE TEXTURIZADA */}
                          <div
                            className="relative flex-1 sm:col-span-8 md:col-span-8 lg:col-span-9 py-1 px-2.5 sm:pr-4 flex items-center overflow-hidden min-w-0"
                            style={{
                              background: 'linear-gradient(180deg, #3a1912 0%, #270f09 50%, #1a0805 100%)',
                              backgroundImage: 'linear-gradient(180deg, #3a1912 0%, #220b06 100%), repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 4px)',
                              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.85), inset 0 -2px 4px rgba(0,0,0,0.85), inset 1px 0 2px rgba(0,0,0,0.7)',
                              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 0 100%)',
                            }}
                          >
                            {/* Grampos metálicos superiores (dentes de ferro cravados na madeira) */}
                            <div className="absolute top-0 left-2 right-4 h-[4px] pointer-events-none flex justify-between overflow-hidden z-20">
                              {[...Array(7)].map((_, idx) => (
                                <span
                                  key={`clamp-top-${idx}`}
                                  className="w-2.5 h-1.5 bg-gradient-to-b from-[#546473] to-[#1e252c] border-x border-b border-[#0d1115] shadow-xs"
                                  style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                                />
                              ))}
                            </div>

                            {/* Grampos metálicos inferiores (dentes de ferro cravados na madeira) */}
                            <div className="absolute bottom-0 left-2 right-4 h-[4px] pointer-events-none flex justify-between overflow-hidden z-20">
                              {[...Array(7)].map((_, idx) => (
                                <span
                                  key={`clamp-bot-${idx}`}
                                  className="w-2.5 h-1.5 bg-gradient-to-t from-[#546473] to-[#1e252c] border-x border-t border-[#0d1115] shadow-xs"
                                  style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }}
                                />
                              ))}
                            </div>

                            {/* Colunas internas de dados alinhadas */}
                            <div className="w-full flex items-center justify-between sm:grid sm:grid-cols-8 lg:grid-cols-9 gap-1.5 z-10 min-w-0">
                              {/* Nome & Subtítulo */}
                              <div className="min-w-0 flex-1 sm:col-span-5 md:col-span-4 pr-1 sm:pr-2 overflow-hidden">
                                <h4
                                  onClick={() => !bloqueadoEpico && handleAbrirDetalhes(item)}
                                  className={`font-cinzel text-xs sm:text-[13px] font-bold tracking-wider truncate cursor-pointer transition-colors ${
                                    bloqueadoEpico
                                      ? 'text-[#5a4228]'
                                      : 'text-[#f2dfa8] hover:text-[#fff5db]'
                                  }`}
                                  style={{
                                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.9)',
                                  }}
                                  title={item.nome}
                                >
                                  {item.nome}
                                </h4>
                                <div className="text-[10px] text-[#bda171] truncate flex items-center gap-1 font-serif mt-0.5">
                                  <span className="text-[#c7aa78] truncate">{item.subcategoria || categoriaAtivaInfo?.label}</span>
                                  {item.material && (
                                    <>
                                      <span className="text-[#71542f]">&bull;</span>
                                      <span className="text-[#decbb0] truncate">{item.material}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Preço */}
                              <div className="shrink-0 sm:col-span-3 md:col-span-2 border-l border-[#8c6b41]/40 pl-2 pr-1 sm:px-1 flex items-center justify-end sm:justify-center gap-1 sm:gap-1.5">
                                <Coins size={12} className="text-[#f59e0b] drop-shadow-[0_0_2px_rgba(245,158,11,0.6)] shrink-0" />
                                <span className="font-mono text-xs sm:text-sm font-bold text-[#fde68a] tracking-wider whitespace-nowrap">
                                  {item.preco.toLocaleString('pt-BR')}
                                </span>
                              </div>

                              {/* Propriedades (MD+) */}
                              <div className="hidden md:flex col-span-2 border-l border-[#8c6b41]/40 px-2 items-center justify-center text-center">
                                {item.categoria === 'mercado_ld' || item.tensao !== undefined ? (
                                  <div className="text-[11px] truncate font-mono">
                                    <span className="text-[#fde68a] font-semibold">
                                      Tensão {item.tensao !== undefined ? item.tensao : item.dano}
                                    </span>
                                    {item.dano && item.dano !== item.tensao && (
                                      <span className="text-red-300 font-semibold ml-1">
                                        ({item.dano})
                                      </span>
                                    )}
                                  </div>
                                ) : item.dano ? (
                                  <span className="text-[11px] text-red-300 font-mono font-semibold">
                                    Dano {item.dano}
                                  </span>
                                ) : item.rd_base ? (
                                  <span className="text-[11px] text-[#fde68a] font-mono font-semibold">
                                    RD +{item.rd_base}
                                  </span>
                                ) : item.efeito_resumo ? (
                                  <span className="text-[10px] text-[#dfcfb5] truncate font-serif italic">
                                    {item.efeito_resumo}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-[#71542f] font-mono">-</span>
                                )}
                              </div>

                              {/* Peso (LG+) */}
                              <div className="hidden lg:flex col-span-1 border-l border-[#8c6b41]/40 items-center justify-center text-center">
                                <span className="text-[11px] text-[#decbb0] font-mono">
                                  {item.peso ? `${item.peso} kg` : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* BOTÕES DE AÇÃO: INFO & COMPRAR (No mobile ficam em barra inferior ergonômica, no sm/md voltam para a grade) */}
                        <div className="flex sm:contents items-center justify-between sm:justify-center gap-2 pt-1 sm:pt-0 border-t border-[#3a2c1d]/60 sm:border-0">
                          {/* 3. BOTÃO DE INFORMAÇÃO (i) CIRCULAR CRAVADO NO METAL */}
                          <div className="sm:col-span-1 flex items-center justify-center shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!bloqueadoEpico) {
                                  handleAbrirDetalhes(item);
                                }
                              }}
                              disabled={bloqueadoEpico}
                              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                                bloqueadoEpico
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:scale-105 hover:brightness-125 cursor-pointer active:scale-95'
                              }`}
                              style={{
                                background: 'linear-gradient(180deg, #303942 0%, #191f25 50%, #0c0e11 100%)',
                                border: '1px solid #4a5866',
                                boxShadow: 'inset 0 1.5px 2px rgba(0,0,0,0.95), 0 1px 2px rgba(0,0,0,0.6)',
                              }}
                              title="Ver informações completas do item"
                            >
                              <span
                                className="font-serif italic font-black text-xs sm:text-[13px] text-[#f59e0b] select-none leading-none pl-0.5"
                                style={{
                                  textShadow: '0 0 5px rgba(245, 158, 11, 0.75), 0 1px 2px #000',
                                }}
                              >
                                i
                              </span>
                            </button>
                          </div>

                          {/* 4. BOTÃO COMPRAR PADRÃO DO SISTEMA (GothicButton) */}
                          <div className="flex-1 sm:flex-initial sm:col-span-2 md:col-span-1 sm:pl-1 flex items-center justify-end">
                            <GothicButton
                              id={`btn-comprar-${item.id}`}
                              disabled={bloqueadoEpico}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!bloqueadoEpico) {
                                  handleAbrirDetalhes(item);
                                }
                              }}
                              variant="primary"
                              size="xs"
                              width="100%"
                              height={30}
                              title={bloqueadoEpico ? 'Arsenal Restrito' : 'Comprar Item'}
                              icon={bloqueadoEpico ? <Lock size={11} /> : undefined}
                            >
                              {bloqueadoEpico ? '' : 'COMPRAR'}
                            </GothicButton>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!carregandoItens && !erroItens && totalItens > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-2">
                <span className="text-[10px] sm:text-xs text-[#a88d61] font-serif">
                  Exibindo {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItens)} de {totalItens} itens
                </span>
                <div className="flex items-center gap-2">
                  <GothicButton
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || isPlaceholderData}
                    variant="secondary"
                    size="sm"
                    width={110}
                    height={34}
                  >
                    Anterior
                  </GothicButton>
                  <span className="text-[10px] text-[#dcd1ba] font-cinzel whitespace-nowrap">
                    Página {page} de {totalPaginas}
                  </span>
                  <GothicButton
                    onClick={() => setPage((current) => Math.min(totalPaginas, current + 1))}
                    disabled={page >= totalPaginas || isPlaceholderData}
                    variant="secondary"
                    size="sm"
                    width={110}
                    height={34}
                  >
                    Próxima
                  </GothicButton>
                </div>
              </div>
            )}

          </div>
        </MedievalFrame>

      {/* ========================================================================= */}
      {/* TELA 3.1 - MODAL DE DETALHES E COMPRA DE ITEM */}
      {/* ========================================================================= */}
      <ModalDetalhesCompra
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItem}
        saldoAtual={saldoAtual}
        cargaAtual={cargaAtual}
        nomePersonagemComprador={ficha?.identidade?.nome_personagem}
        temPermissaoEpica={temPermissaoEpica}
        onConfirmarCompra={handleConfirmarCompra}
        canManageCatalog={canManageCatalog}
        onEditar={handleAbrirEdicao}
        onExcluir={handleExcluirMercadoria}
      />

      {/* ========================================================================= */}
      {/* TELA 3.2 - MODAL DE CRIAR / EDITAR MERCADORIA (ADMINISTRADOR) */}
      {/* ========================================================================= */}
      <ModalCriarMercadoria
        isOpen={isModalCriarOpen}
        onClose={() => {
          setIsModalCriarOpen(false);
          setItemParaEdicao(null);
        }}
        onVoltar={handleVoltarParaDetalhes}
        onItemCriado={handleItemSalvo}
        itemParaEdicao={itemParaEdicao}
      />

      {/* ========================================================================= */}
      {/* TELA 3.3 - MODAL DE SELEÇÃO DE COMPRADOR DA COMITIVA */}
      {/* ========================================================================= */}
      <ModalSelecionarComprador
        isOpen={isModalCompradorOpen}
        onClose={() => setIsModalCompradorOpen(false)}
        personagens={listaPersonagens}
        personagemSelecionadoId={personagemId}
        onSelecionar={(novoId) => {
          setPersonagemId(novoId);
          setStoreCharacterId(novoId);
        }}
      />

    </div>
  );
};

export default MercadoPage;
