export * from './saas';

/** Personagem do acervo de um cliente (tenant), exibido na galeria de Personagens. */
export interface TenantCharacter {
  id: string;
  name: string;
  image: string | null;
  largeImage?: string;
  letter: string;
  isKnown: boolean;
  quote?: string;
  quoteSource?: string;
  description?: string[];
}

export interface FichaIdentidade {
  id: string;
  user_id: string;
  tenant_id?: string;
  campanha_id?: string;
  nome_personagem: string;
  imagem_url?: string;
  raca: string;
  nivel: number;
  pts: number;
  xp: number;
  cor_aura: string;
  estilo_tema?: string;
  edicao_liberada: boolean;
  /** Liberação concedida pelo Mestre para comprar no Arsenal Épico do mercado. */
  acesso_mercado_epico?: boolean;
  historia?: string;
}

export interface FichaAtributos {
  ficha_id: string;
  for: { valor_base: number; extra: number; perda: number };
  agi: { valor_base: number; extra: number; perda: number };
  comb: { valor_base: number; extra: number; perda: number };
  pont: { valor_base: number; extra: number; perda: number };
  int: { valor_base: number; extra: number; perda: number };
  sab: { valor_base: number; extra: number; perda: number };
  vit: { valor_base: number; extra: number; perda: number };
  car: { valor_base: number; extra: number; perda: number };
  art: { valor_base: number; extra: number; perda: number };
  alm: { valor_base: number; extra: number; perda: number };
}

export interface FichaStatus {
  ficha_id: string;
  vida_max: number;
  vida_atual: number;
  energia_max: number;
  energia_atual: number;
  vigor_max: number;
  vigor_atual: number;
  folego: number;
  north: number;
}

export interface FichaRecursos {
  ficha_id: string;
  dinheiro: number;
  /** Nome curto do outro valor do personagem (ex.: PO, Pontos). */
  outros?: string;
  /** Quantidade do outro valor nomeado em `outros`. */
  outros_valor?: number;
  carga_total_peso: number;
  carga_status: 'Normal' | 'Leve' | 'Média' | 'Pesada' | 'Muito Pesada';
}

export interface FichaDefesas {
  ficha_id: string;
  esquiva: number;
  aparar: number;
  bloquear: number;
  bloquear_magico: number;
  reflexo: number;
  sanidade: number;
  coragem: number;
  imunidade: number;
  constituicao: number;
  percepcao: number;
}

export interface FichaTreinamento {
  id: string;
  ficha_id: string;
  categoria: 'Maestria' | 'Habilidade';
  tipo: string;
  nome: string;
  graduacao: number; // 1-5
  nh_calculado: number;
}

export interface FichaCompleta {
  identidade: FichaIdentidade;
  atributos: FichaAtributos;
  status: FichaStatus;
  recursos: FichaRecursos;
  defesas: FichaDefesas;
  treinamentos: FichaTreinamento[];
  suporte: {
    mult_vida: number;
    dano_natural: number;
    vel_basica: number;
    deslocamento: number;
    talentos: string;
    desvantagens: string;
    especializacao: string;
    anotacoes: string;
    grimorio_pagina1: string;
    grimorio_pagina2: string;
    armadura: {
      nome?: string;
      peso?: number;
      efeito?: string;
      tipo?: string;
      material?: string;
      requisitos?: string;
      descricao?: string;
      elmo: number;
      gorjal: number;
      couraca: number;
      bracal: number;
      manoplas: number;
      coxote: number;
      calca: number;
      grevas: number;
    };
    montaria?: {
      nome?: string;
      raca?: string;
      tipo?: string;
      peso?: number;
      velocidade?: number | string;
      habilidades?: string;
      requisitos?: string;
      descricao?: string;
      cabeca: number;
      tronco: number;
      superiores: number;
      inferiores: number;
    };
    armamento: {
      arma_primaria?: { nome?: string; dano?: string; dano_arma?: string; dano_total?: string; resist?: number; peso?: number; preco?: number; efeito?: string; efeito_resumo?: string; categoria?: string; subcategoria?: string; tipo?: string; material?: string; efeito_completo?: string; requisitos?: string; descricao?: string; citacao?: string; informacoes?: string; is_epico?: boolean; imagem_url?: string; icone_tipo?: string; rd_base?: number; rd_por_peca?: any };
      segunda_arma?: { nome?: string; dano?: string; dano_arma?: string; dano_total?: string; resist?: number; peso?: number; preco?: number; efeito?: string; efeito_resumo?: string; categoria?: string; subcategoria?: string; tipo?: string; material?: string; efeito_completo?: string; requisitos?: string; descricao?: string; citacao?: string; informacoes?: string; is_epico?: boolean; imagem_url?: string; icone_tipo?: string; rd_base?: number; rd_por_peca?: any };
      arma_suporte?: { nome?: string; dano?: string; dano_arma?: string; dano_total?: string; resist?: number; peso?: number; preco?: number; efeito?: string; efeito_resumo?: string; categoria?: string; subcategoria?: string; tipo?: string; material?: string; efeito_completo?: string; requisitos?: string; descricao?: string; citacao?: string; informacoes?: string; is_epico?: boolean; imagem_url?: string; icone_tipo?: string; rd_base?: number; rd_por_peca?: any };
      arco_ld?: { nome?: string; dano?: string; dano_flecha?: string; dano_total?: string; prec?: number; tensao?: number; peso?: number; preco?: number; efeito?: string; efeito_resumo?: string; categoria?: string; subcategoria?: string; tipo?: string; material?: string; efeito_completo?: string; requisitos?: string; descricao?: string; citacao?: string; informacoes?: string; is_epico?: boolean; imagem_url?: string; icone_tipo?: string };
    };
    inventario: Array<{ id: string; item: string; nome?: string; peso: number; quantidade?: number; descricao: string; descricao_completa?: string; categoria?: string; subcategoria?: string; tipo?: string; material?: string; preco?: number; dano?: string | number; dano_arma?: string | number; resist?: number; tensao?: number | string; prec?: number | string; rd_base?: number; rd_por_peca?: any; efeito?: string; efeito_resumo?: string; efeito_completo?: string; citacao?: string; informacoes?: string; requisitos?: string; is_raro?: boolean; is_epico?: boolean; imagem_url?: string; icone_tipo?: string }>;
    ext_per: {
      north_ext: number;
      north_per: number;
      vida_ext: number;
      vida_per: number;
      vigor_ext: number;
      vigor_per: number;
    };
  };
}

export interface MercadoArma {
  id: string;
  nome: string;
  tipo_categoria: 'Cc' | 'C' | 'L' | 'V' | 'AH' | 'K';
  peso: number;
  dano: string;
  material: string;
  resist: number;
  efeito?: string;
  preco: number;
  is_epico?: boolean;
}

export interface MercadoArmadura {
  id: string;
  nome: string;
  tipo: 'Leve' | 'Média' | 'Pesada';
  peso: number;
  rd_base: number;
  material: string;
  pecas: string;
  efeito?: string;
  preco: number;
  is_epico?: boolean;
  rd_por_peca?: {
    elmo: number;
    gorjal: number;
    couraca: number;
    bracal: number;
    manoplas: number;
    coxote: number;
    calca: number;
    grevas: number;
  };
}

export interface ArmaduraCatalogItem extends MercadoArmadura {
  rd_por_peca: {
    elmo: number;
    gorjal: number;
    couraca: number;
    bracal: number;
    manoplas: number;
    coxote: number;
    calca: number;
    grevas: number;
  };
  requisitos?: string;
  descricao?: string;
}

export type CategoriaMercado =
  | 'mercado_armas'
  | 'mercado_armaduras'
  | 'mercado_ld'
  | 'mercado_progeteis'
  | 'mercado_arremesso'
  | 'mercado_acessorios'
  | 'mercado_geral'
  | 'arsenal_epico'
  // Categorias específicas do Arsenal Épico
  | 'epico_armas'
  | 'epico_armaduras'
  | 'epico_escudos'
  | 'epico_ld'
  // Categorias específicas do Mercado Arcano
  | 'arcano_consumiveis'
  | 'arcano_talismas'
  | 'arcano_pocoes'
  | 'arcano_chapeus'
  | 'arcano_vestimentas'
  | 'arcano_cajados'
  | 'arcano_aneis'
  | 'arcano_colares';

export interface MercadoItem {
  id: string;
  nome: string;
  categoria: CategoriaMercado;
  preco: number;
  peso: number;
  material?: string;
  dano?: string | number;
  rd_base?: number;
  tensao?: string | number;
  prec?: string | number;
  alcance?: string;
  duracao?: string;
  consequencia?: string;
  ativacao?: string;
  gasto?: string;
  carga?: string;
  lr?: string;
  poder?: string;
  recarga?: string;
  rm?: string;
  dependencia?: string;
  uso?: string;
  efeito?: string;
  efeito_resumo?: string;
  efeito_completo?: string;
  citacao?: string;
  requisitos?: string;
  is_raro?: boolean;
  descricao?: string;
  informacoes?: string;
  is_epico?: boolean;
  icone_tipo: string;
  tipo?: string;
  subcategoria?: string;
  resist?: number;
  pecas?: string;
  imagem_url?: string;
  rd_por_peca?: {
    elmo: number;
    gorjal: number;
    couraca: number;
    bracal: number;
    manoplas: number;
    coxote: number;
    calca: number;
    grevas: number;
  };
}

export interface ArmamentoCatalogItem {
  id: string;
  nome: string;
  tipo: 'Corpo a Corpo' | 'Longa Distância';
  categoria: string;
  material: string;
  peso: number;
  dano: string;
  resist: number;
  preco: number;
  is_epico?: boolean;
  efeito_resumo: string;
  efeito_completo?: string;
  requisitos?: string;
  descricao?: string;
  // Campos específicos para Arco / Longa Distância:
  prec?: number;
  tensao?: number;
}

export interface MontariaCatalogItem {
  id: string;
  nome: string;
  raca: string;
  tipo: string;
  peso: number;
  velocidade: number | string;
  rd_base: number;
  preco: number;
  is_epico?: boolean;
  habilidades: string;
  requisitos?: string;
  descricao?: string;
  rd_por_peca: {
    cabeca: number;
    tronco: number;
    superiores: number;
    inferiores: number;
  };
}

export interface MercadoMagia {
  id: string;
  nome: string;
  escola?: string;
  nivel: 'Simples' | 'Intermédia' | 'Superior' | 'Mestre' | 'Arcana' | 'Etérea Arcana' | 'Grão Arcano' | 'Divina';
  grau?: number;
  descricao: string;
  dificuldade: string | number;
  processo?: string;
  pratica?: string;
  dano?: string;
  duracao?: string;
  alcance?: string;
  efeitos_magicos?: string;
  consumo: string;
  tipo: string;
  canalizacao?: string;
  condicao?: string;
  imagem_url?: string;
}

export interface Cronica {
  id: string;
  campanha_id: string;
  titulo: string;
  data_sessao: string;
  imagem_capa?: string;
  relato_narrativa: string;
  created_at: string;
}

export interface Sessao {
  id: string;
  campanha_id: string;
  titulo: string;
  data_hora: string;
  pauta: string;
  link_vtt?: string;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
}

export interface BibliotecaLivro {
  id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  capa_url?: string;
  arquivo_url?: string;
}
