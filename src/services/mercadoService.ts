import { MercadoItem, CategoriaMercado } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useSessionStore } from '@/store/useSessionStore';
import { fichaService } from './fichaService';
import { normalizarBusca, TAMANHO_MINIMO_BUSCA } from '@/utils/normalizarBusca';
import { invalidateAsyncDataCache } from '../hooks/useAsyncData';
import { cacheKeyPrefixes } from './cacheKeys';
import { withTimeout } from '../utils/withTimeout';

const COLUNAS_TIPADAS = ['nome', 'categoria', 'material', 'peso', 'dano', 'rd_base', 'preco', 'is_epico', 'efeito', 'descricao', 'icone_tipo', 'imagem_url'] as const;
const CAMPOS_EXTRA = ['tipo', 'subcategoria', 'resist', 'pecas', 'rd_por_peca', 'tensao', 'prec', 'alcance', 'duracao', 'consequencia', 'ativacao', 'gasto', 'carga', 'lr', 'poder', 'recarga', 'rm', 'dependencia', 'uso', 'efeito_resumo', 'efeito_completo', 'citacao', 'requisitos', 'is_raro', 'informacoes'] as const satisfies readonly (keyof MercadoItem)[];

type MarketRow = {
  id: string;
  nome: string;
  categoria: string;
  material: string | null;
  peso: number | string | null;
  dano: string | null;
  rd_base: number | string | null;
  preco: number | string | null;
  is_epico: boolean;
  efeito: string | null;
  descricao: string | null;
  icone_tipo: string | null;
  imagem_url: string | null;
  dados: Record<string, unknown> | null;
};

type NovidadeRow = MarketRow & { created_at: string };

export interface NovidadeMercado {
  item: MercadoItem;
  criadoEm: string;
}

function toRow(item: MercadoItem) {
  const dados = Object.fromEntries(
    CAMPOS_EXTRA.flatMap((campo) => item[campo] !== undefined ? [[campo, item[campo]]] : [])
  );
  const colunasTipadas: Record<typeof COLUNAS_TIPADAS[number], unknown> = {
    nome: item.nome,
    categoria: item.categoria,
    material: item.material ?? null,
    peso: Number(item.peso) || 0,
    dano: item.dano ?? null,
    rd_base: Number(item.rd_base) || 0,
    preco: Number(item.preco) || 0,
    is_epico: Boolean(item.is_epico),
    efeito: item.efeito ?? null,
    descricao: item.descricao ?? null,
    icone_tipo: item.icone_tipo ?? 'sword',
    imagem_url: item.imagem_url ?? null,
  };

  return { ...colunasTipadas, dados };
}

function fromRow(row: MarketRow): MercadoItem {
  return {
    ...(row.dados ?? {}),
    id: row.id,
    nome: row.nome,
    categoria: row.categoria as CategoriaMercado,
    material: row.material ?? undefined,
    peso: Number(row.peso) || 0,
    dano: row.dano ?? undefined,
    rd_base: Number(row.rd_base) || 0,
    preco: Number(row.preco) || 0,
    is_epico: Boolean(row.is_epico),
    efeito: row.efeito ?? undefined,
    descricao: row.descricao ?? undefined,
    icone_tipo: row.icone_tipo ?? 'sword',
    imagem_url: row.imagem_url ?? undefined,
  } as MercadoItem;
}

export interface MercadoFiltros {
  categoria: CategoriaMercado;
  subcategoria?: string;
  busca?: string;
  page: number;
  pageSize: number;
}

export interface MercadoPagina {
  itens: MercadoItem[];
  total: number;
}

export interface MercadoLookupRef {
  id?: string;
  nome?: string;
}

const COLUNAS_LISTAGEM = 'id, nome, categoria, material, peso, dano, rd_base, preco, is_epico, efeito, descricao, icone_tipo, imagem_url, dados';
const lookupItens = new Map<string, MercadoItem>();
const CATALOGO_TTL_MS = 60_000;
const catalogoPorCategoria = new Map<CategoriaMercado, { itens: MercadoItem[]; carregadoEm: number }>();

export async function contarItens(): Promise<number> {
  const { count, error } = await withTimeout(Promise.resolve(
    supabase.from('market_items').select('id', { count: 'exact', head: true })
  ));
  if (error) throw new Error('Não foi possível contar as mercadorias do mercado: ' + error.message);
  return count ?? 0;
}

export async function listarNovidades(limite = 6): Promise<NovidadeMercado[]> {
  const { data, error } = await supabase
    .from('market_items')
    .select(`${COLUNAS_LISTAGEM}, created_at`)
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(limite);
  if (error) throw new Error('Não foi possível carregar as novidades do mercado: ' + error.message);
  return ((data ?? []) as unknown as NovidadeRow[]).map((row) => ({
    item: fromRow(row),
    criadoEm: row.created_at,
  }));
}

function limparCaches(): void {
  lookupItens.clear();
  catalogoPorCategoria.clear();
  invalidateAsyncDataCache(cacheKeyPrefixes.catalogoDoReino);
  invalidateAsyncDataCache(cacheKeyPrefixes.mercadoNovidades);
}

function valorPostgrest(value: string): string {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function clausulasSubcategoria(categoria: CategoriaMercado, valor: string): string[] {
  const clausulas = [
    `dados->>subcategoria.eq.${valorPostgrest(valor)}`,
    `dados->>tipo.eq.${valorPostgrest(valor)}`,
  ];
  const armas: Record<string, string[]> = {
    'Armas Combate Curto (Cc)': ['icone_tipo.eq.dagger', 'nome.ilike."%adaga%"', 'nome.ilike."%faca%"'],
    'Armas Curtas': ['icone_tipo.eq.axe', 'icone_tipo.eq.mace', 'nome.ilike."%machado%"', 'nome.ilike."%maça%"'],
    'Armas Longas': ['icone_tipo.eq.sword', 'nome.ilike."%espada%"', 'nome.ilike."%sabre%"'],
    'Arma de Haste (AH)': ['icone_tipo.eq.spear', 'nome.ilike."%lança%"', 'nome.ilike."%haste%"'],
    'Viper (V)': ['nome.ilike."%viper%"', 'nome.ilike."%florete%"', 'nome.ilike."%estocada%"'],
    'Destroyer (D)': ['nome.ilike."%destroyer%"', 'nome.ilike."%montante%"', 'nome.ilike."%martelo%"'],
    'Armas Kobudo (K)': ['nome.ilike."%kobudo%"', 'nome.ilike."%marcial%"', 'nome.ilike."%nunchaku%"'],
  };
  const armaduras: Record<string, string[]> = {
    'Armaduras Leves': ['icone_tipo.eq.armor_leather', 'peso.lt.6'],
    'Armaduras Médias': ['icone_tipo.eq.armor_mail', 'icone_tipo.eq.armor_breastplate'],
    'Armaduras Pesadas': ['icone_tipo.eq.armor_plate', 'peso.gt.10'],
  };
  const longaDistancia: Record<string, string[]> = {
    Arcos: ['icone_tipo.eq.bow', 'nome.ilike."%arco%"', 'dados->>subcategoria.ilike."%arco%"', 'dados->>tipo.ilike."%arco%"'],
    Bestas: ['icone_tipo.eq.crossbow', 'nome.ilike."%besta%"', 'dados->>subcategoria.ilike."%besta%"', 'dados->>tipo.ilike."%besta%"'],
    Funda: ['nome.ilike."%funda%"', 'dados->>subcategoria.ilike."%funda%"', 'dados->>tipo.ilike."%funda%"'],
    Bumerangue: ['nome.ilike."%bumerangue%"', 'dados->>subcategoria.ilike."%bumerangue%"', 'dados->>tipo.ilike."%bumerangue%"'],
    Zarabatana: ['nome.ilike."%zarabatana%"', 'dados->>subcategoria.ilike."%zarabatana%"', 'dados->>tipo.ilike."%zarabatana%"'],
    Estilingue: ['nome.ilike."%estilingue%"', 'dados->>subcategoria.ilike."%estilingue%"', 'dados->>tipo.ilike."%estilingue%"'],
  };
  const projeteis: Record<string, string[]> = {
    Flechas: ['nome.ilike."%flecha%"'],
    Virotes: ['nome.ilike."%virote%"'],
  };

  if (categoria === 'mercado_armas') clausulas.push(...(armas[valor] ?? []));
  if (categoria === 'mercado_armaduras') clausulas.push(...(armaduras[valor] ?? []));
  if (categoria === 'mercado_ld') clausulas.push(...(longaDistancia[valor] ?? []));
  if (categoria === 'mercado_progeteis') clausulas.push(...(projeteis[valor] ?? []));
  if (categoria === 'mercado_acessorios') {
    const termo = valor.toLowerCase();
    clausulas.push(
      `nome.ilike.${valorPostgrest(`%${termo}%`)}`,
      `dados->>subcategoria.ilike.${valorPostgrest(`%${termo}%`)}`,
      `dados->>tipo.ilike.${valorPostgrest(`%${termo}%`)}`,
    );
  }
  return clausulas;
}

function aplicarCategoria<T extends { eq: (column: string, value: string) => T; or: (filters: string) => T }>(query: T, categoria: CategoriaMercado): T {
  return categoria === 'arsenal_epico'
    ? query.or('is_epico.eq.true,categoria.eq.arsenal_epico,categoria.like.epico_*')
    : query.eq('categoria', categoria);
}

export async function listarItens(filtros: MercadoFiltros): Promise<MercadoPagina> {
  let query = supabase
    .from('market_items')
    .select(COLUNAS_LISTAGEM, { count: 'exact' })
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })
    .order('id', { ascending: true });
  query = aplicarCategoria(query, filtros.categoria);

  if (filtros.subcategoria && filtros.subcategoria !== 'todas') {
    query = query.or(clausulasSubcategoria(filtros.categoria, filtros.subcategoria).join(','));
  }
  const termoBusca = normalizarBusca(filtros.busca ?? '');
  if (termoBusca.length >= TAMANHO_MINIMO_BUSCA) {
    query = query.ilike('busca', `%${termoBusca}%`);
  }
  const inicio = (filtros.page - 1) * filtros.pageSize;
  const { data, count, error } = await query.range(inicio, inicio + filtros.pageSize - 1);
  if (error) throw new Error('Não foi possível carregar o catálogo do mercado: ' + error.message);
  return { itens: ((data ?? []) as MarketRow[]).map(fromRow), total: count ?? 0 };
}

export async function carregarLookupDeItens(refs: MercadoLookupRef[]): Promise<void> {
  const ids = new Set<string>();
  const nomes = new Set<string>();
  for (const ref of refs) {
    const id = ref.id?.trim();
    const nome = ref.nome?.trim().toLowerCase();
    if (id && !lookupItens.has(id)) ids.add(id);
    if (nome && !lookupItens.has(nome)) nomes.add(nome);
  }
  const consultas: { filtro: string; nome?: string }[] = [
    ...[...ids].map((id) => ({ filtro: `id.eq.${valorPostgrest(id)}` })),
    ...[...nomes].map((nome) => ({ filtro: `nome.ilike.${valorPostgrest(`%${nome}%`)}`, nome })),
  ];
  for (let inicio = 0; inicio < consultas.length; inicio += 200) {
    const lote = consultas.slice(inicio, inicio + 200);
    const { data, error } = await supabase
      .from('market_items')
      .select(COLUNAS_LISTAGEM)
      .or(lote.map((consulta) => consulta.filtro).join(','))
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true });
    if (error) throw new Error('Não foi possível carregar os itens referenciados pela ficha: ' + error.message);
    for (const row of (data ?? []) as MarketRow[]) {
      const item = fromRow(row);
      lookupItens.delete(item.id);
      lookupItens.delete(item.nome.trim().toLowerCase());
      lookupItens.set(item.id, item);
      lookupItens.set(item.nome.trim().toLowerCase(), item);
      for (const consulta of lote) {
        const nomeConsultado = consulta.nome?.trim().toLowerCase();
        if (nomeConsultado && !lookupItens.has(nomeConsultado) && item.nome.toLowerCase().includes(nomeConsultado)) {
          lookupItens.set(nomeConsultado, item);
        }
      }
    }
    while (lookupItens.size > 1000) {
      const chaveMaisAntiga = lookupItens.keys().next().value;
      if (chaveMaisAntiga === undefined) break;
      lookupItens.delete(chaveMaisAntiga);
    }
  }
}

export function consultarLookupDeItens(id?: string, nome?: string): MercadoItem | undefined {
  if (id) {
    const porId = lookupItens.get(id.trim());
    if (porId) return porId;
  }
  return nome ? lookupItens.get(nome.trim().toLowerCase()) : undefined;
}

async function listarPaginaDeCategoria(categoria: CategoriaMercado, inicio: number, fim: number) {
  let query = supabase
    .from('market_items')
    .select(COLUNAS_LISTAGEM, { count: 'exact' })
    .order('ordem', { ascending: true })
    .order('created_at', { ascending: false })
    .order('id', { ascending: true });
  query = aplicarCategoria(query, categoria);
  const { data, count, error } = await query.range(inicio, fim);
  if (error) throw new Error('Não foi possível carregar o catálogo do mercado: ' + error.message);
  return { itens: ((data ?? []) as MarketRow[]).map(fromRow), total: count ?? 0 };
}

async function getItensPorCategoria(categoria: CategoriaMercado): Promise<MercadoItem[]> {
  const cache = catalogoPorCategoria.get(categoria);
  if (cache && Date.now() - cache.carregadoEm < CATALOGO_TTL_MS) return cache.itens;

  const itens: MercadoItem[] = [];
  let total = 0;
  do {
    const pagina = await listarPaginaDeCategoria(categoria, itens.length, itens.length + 999);
    itens.push(...pagina.itens);
    total = pagina.total;
  } while (itens.length < total);
  catalogoPorCategoria.set(categoria, { itens, carregadoEm: Date.now() });
  return itens;
}

async function upsertMercadoria(item: MercadoItem, operation: 'criar' | 'atualizar'): Promise<MercadoItem> {
  const sessionUserId = useSessionStore.getState().session?.user.id ?? null;
  const { error } = await supabase
    .from('market_items')
    .upsert({ id: item.id, ...toRow(item), created_by: sessionUserId }, { onConflict: 'id' });

  if (error) throw new Error(`Não foi possível ${operation} mercadoria: ` + error.message);
  // O item mudou: o lookup da ficha não pode continuar servindo a cópia antiga.
  limparCaches();
  return item;
}

export const mercadoService = {
  listarItens,
  listarNovidades,
  contarItens,
  getItensPorCategoria,
  limparCaches,

  efetuarCompra: async ({
    fichaId,
    item,
    quantidade,
  }: {
    fichaId: string;
    item: MercadoItem;
    quantidade: number;
  }): Promise<{ sucesso: boolean; mensagem: string; saldoRestante: number; novoPeso: number }> => {
    const ficha = await fichaService.getFicha(fichaId);
    if (!ficha) {
      throw new Error('Ficha do personagem não encontrada.');
    }

    const custoTotal = item.preco * quantidade;
    const saldoAtual = ficha.recursos?.dinheiro || 0;

    if (saldoAtual < custoTotal) {
      throw new Error(`Saldo insuficiente. Você possui ${saldoAtual} Moedas e a compra custa ${custoTotal}.`);
    }

    // Deduz o custo do dinheiro
    const novoDinheiro = saldoAtual - custoTotal;
    ficha.recursos.dinheiro = novoDinheiro;

    // Adiciona o item comprado ao inventário
    const pesoAcrescentado = (item.peso || 0) * quantidade;
    const inventarioAtual = ficha.suporte.inventario || [];

    const itemExistenteIndex = inventarioAtual.findIndex(
      (inv) => inv.item.toLowerCase() === item.nome.toLowerCase()
    );

    const desc = item.citacao || item.descricao || (item.efeito ? `${item.material || ''} - ${item.efeito}` : (item.material || 'Item adquirido no mercado'));

    const itemProps = {
      item: item.nome,
      nome: item.nome,
      peso: Number((item.peso || 0).toFixed(2)),
      descricao: desc,
      descricao_completa: item.descricao || item.informacoes || item.efeito || desc,
      citacao: item.citacao || item.informacoes,
      informacoes: item.informacoes || item.citacao || item.descricao,
      categoria: item.categoria,
      subcategoria: item.subcategoria,
      tipo: item.tipo,
      material: item.material,
      preco: item.preco !== undefined ? item.preco : 0,
      dano: item.dano,
      dano_arma: item.dano,
      resist: item.resist !== undefined ? item.resist : (item as { resistencia?: number }).resistencia,
      tensao: item.tensao,
      prec: item.prec,
      rd_base: item.rd_base,
      rd_por_peca: item.rd_por_peca,
      efeito: item.efeito,
      efeito_resumo: item.efeito_resumo || item.efeito,
      efeito_completo: item.efeito_completo || item.efeito,
      requisitos: item.requisitos || item.material,
      is_raro: Boolean(item.is_epico),
      is_epico: Boolean(item.is_epico),
      imagem_url: item.imagem_url,
      icone_tipo: item.icone_tipo,
    };

    if (itemExistenteIndex >= 0) {
      // Atualiza quantidade e consolida todos os atributos técnicos do item
      const it = inventarioAtual[itemExistenteIndex];
      const novaQtd = (it.quantidade || 1) + quantidade;
      Object.assign(it, itemProps, {
        id: it.id,
        quantidade: novaQtd,
        peso: Number(((it.peso || item.peso || 0)).toFixed(2)),
        is_raro: Boolean(item.is_epico || it.is_raro),
        is_epico: Boolean(item.is_epico || it.is_epico),
      });
    } else {
      inventarioAtual.push({
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        quantidade: quantidade,
        ...itemProps,
      });
    }

    ficha.suporte.inventario = inventarioAtual;

    // Recalcula ficha completa (carga_total_peso, statusCarga, defesas, penalidades)
    const fichaAtualizada = fichaService.calcularEngine(ficha);
    await fichaService.saveFicha(fichaId, fichaAtualizada);

    return {
      sucesso: true,
      mensagem: `Compra de ${quantidade}x ${item.nome} realizada com sucesso!`,
      saldoRestante: fichaAtualizada.recursos.dinheiro,
      novoPeso: fichaAtualizada.recursos.carga_total_peso,
    };
  },

  criarMercadoria: async (item: MercadoItem): Promise<MercadoItem> => upsertMercadoria(item, 'criar'),

  atualizarMercadoria: async (item: MercadoItem): Promise<MercadoItem> => upsertMercadoria(item, 'atualizar'),

  excluirMercadoria: async (id: string): Promise<boolean> => {
    const { error } = await supabase.from('market_items').delete().eq('id', id);
    if (error) throw new Error('Não foi possível excluir mercadoria: ' + error.message);
    // O item deixou de existir: o lookup da ficha não pode continuar servindo-o.
    limparCaches();
    return true;
  },
};
