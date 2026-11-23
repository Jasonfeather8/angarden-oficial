import React from 'react';
import { Package } from 'lucide-react';
import type { CategoriaMercado } from '../../types';

/** Seção principal do mercado exibida nas grandes abas. */
export type SecaoMercado = 'arsenal' | 'comum' | 'epico' | 'arcano';

/** Estética aplicada à tela conforme a seção/categoria ativa. */
export type ThemeModeMercado = 'default' | 'epico' | 'arcano';

export interface SubcategoriaMercado {
  id: string;
  label: string;
  sigla?: string;
  desc?: string;
}

export interface TabMercado {
  id: CategoriaMercado;
  label: string;
  icon: React.ReactNode;
  isEpic?: boolean;
  descricao: string;
}

/** Categoria inicial de cada seção ao trocar de aba. */
export const CATEGORIA_INICIAL_POR_SECAO: Record<SecaoMercado, CategoriaMercado> = {
  arsenal: 'mercado_armas',
  comum: 'mercado_comum',
  arcano: 'arcano_consumiveis',
  epico: 'epico_armas',
};

// Mapeamento oficial de subcategorias por categoria principal
export const SUBCATEGORIAS_POR_CATEGORIA: Partial<Record<CategoriaMercado, SubcategoriaMercado[]>> = {
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
  mercado_comum: [
    { id: 'todas', label: 'Todos os Itens', desc: 'Provisões, utensílios e ferramentas de viagem' },
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

// Mapeamento de abas por Seção Principal do Mercado
export const TABS_POR_SECAO: Record<SecaoMercado, TabMercado[]> = {
  arsenal: [
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
  ],
  comum: [
    {
      id: 'mercado_comum',
      label: 'Provisões',
      descricao: 'Provisões, utensílios e ferramentas de viagem.',
      icon: <Package className="w-6 h-6" />,
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

export const CABECALHO_POR_SECAO: Record<SecaoMercado, { titulo: string; subtitulo: string }> = {
  arsenal: {
    titulo: 'Arsenal & Equipamentos',
    subtitulo: 'Armas, armaduras, escudos, projéteis e equipamentos marciais',
  },
  comum: {
    titulo: 'Mercado Comum & Provisões',
    subtitulo: 'Provisões de viagem, utensílios, ferramentas e poções de alquimia',
  },
  arcano: {
    titulo: 'Mercado Arcano & Misticismo',
    subtitulo: 'Consumíveis mágicos, talismãs celestes, poções etéreas e artefatos de poder arcano',
  },
  epico: {
    titulo: 'Arsenal Épico & Relíquias',
    subtitulo: 'Armamentos lendários, forja mitril e relíquias ancestrais de alto prestígio',
  },
};

/** Estética derivada da seção ativa e da categoria selecionada. */
export function derivarThemeMode(
  secaoMercado: SecaoMercado,
  activeCategory: CategoriaMercado
): ThemeModeMercado {
  if (secaoMercado === 'epico' || activeCategory.startsWith('epico_') || activeCategory === 'arsenal_epico') {
    return 'epico';
  }
  if (secaoMercado === 'arcano' || activeCategory.startsWith('arcano_')) {
    return 'arcano';
  }
  return 'default';
}
