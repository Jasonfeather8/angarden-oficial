import { FichaCompleta, TenantCharacter } from '../types';
import { invalidateAsyncDataCache } from '../hooks/useAsyncData';
import { useSessionStore } from '../store/useSessionStore';
import { supabase } from '@/integrations/supabase/client';
import { cacheKeyPrefixes, cacheKeys } from './cacheKeys';

export interface FichaScope {
  tenantId: string;
  userId: string;
}

export interface MesaResumo {
  id: string;
  nome: string;
  imagemUrl?: string;
  nivel: number;
  xp: number;
  dinheiro: number;
  edicaoLiberada: boolean;
  acessoMercadoEpico: boolean;
  ownerId: string | null;
  podeComprar: boolean;
  acessoMercadoArcano: boolean;
  acessoMercadoLendario: boolean;
  status: { vidaAtual: number; vidaMax: number; vigorAtual: number; vigorMax: number; north: number } | null;
}

function currentScope(): FichaScope | null {
  const session = useSessionStore.getState().session;
  if (!session?.user.tenant_id) return null;
  return { tenantId: session.user.tenant_id, userId: session.user.id };
}

async function findCharacterTenant(characterId: string): Promise<string | null> {
  const { data } = await supabase
    .from('characters')
    .select('tenant_id')
    .eq('id', characterId)
    .maybeSingle();
  return data?.tenant_id ?? null;
}

interface AcervoCharacterRow {
  id: string;
  nome: string;
  created_by: string | null;
  imagem_url: string | null;
  large_image_url: string | null;
  letter: string | null;
  is_known: boolean;
  quote: string | null;
  quote_source: string | null;
  descricao: string[] | null;
}

interface AcervoFichaRow {
  character_id: string;
  tenant_id: string;
  edicao_liberada: boolean;
  acesso_mercado_epico: boolean;
  acesso_mercado_arcano: boolean;
  acesso_mercado_lendario: boolean;
  pode_comprar: boolean;
  dados: FichaCompleta | null;
}

interface AcervoBase {
  characters: AcervoCharacterRow[];
  fichas: AcervoFichaRow[];
}

interface FichaResumoRow {
  character_id: string;
  nome_personagem: string | null;
  imagem_url: string | null;
  historia: string | null;
  raca: string | null;
  nivel: string | null;
  xp: string | null;
  dinheiro: string | null;
  edicao_liberada: boolean;
  acesso_mercado_epico: boolean;
  acesso_mercado_arcano: boolean;
  acesso_mercado_lendario: boolean;
  pode_comprar: boolean;
  vida_atual: string | null;
  vida_max: string | null;
  vigor_atual: string | null;
  vigor_max: string | null;
  north: string | null;
}

interface AcervoResumo {
  characters: AcervoCharacterRow[];
  fichas: FichaResumoRow[];
}

const ACERVO_TTL_MS = 60_000;

let cacheAcervo: { tenantId: string; at: number; base: AcervoBase } | null = null;
let cacheAcervoResumo: { tenantId: string; at: number; base: AcervoResumo } | null = null;

/** Descarta os acervos em memória depois de qualquer escrita que os altere. */
export function invalidarCacheAcervo(): void {
  cacheAcervo = null;
  cacheAcervoResumo = null;
}

async function carregarAcervoBase(tenantId: string): Promise<AcervoBase> {
  const [charactersResult, fichasResult] = await Promise.all([
    supabase
      .from('characters')
      .select('id, nome, created_by, imagem_url, large_image_url, letter, is_known, quote, quote_source, descricao')
      .eq('tenant_id', tenantId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true }),
    supabase.from('fichas').select('character_id, tenant_id, edicao_liberada, acesso_mercado_epico, acesso_mercado_arcano, acesso_mercado_lendario, pode_comprar, dados').eq('tenant_id', tenantId),
  ]);
  if (charactersResult.error) throw new Error('Não foi possível carregar o acervo: ' + charactersResult.error.message);
  if (fichasResult.error) throw new Error('Não foi possível carregar as fichas: ' + fichasResult.error.message);
  return {
    characters: (charactersResult.data ?? []) as AcervoCharacterRow[],
    fichas: (fichasResult.data ?? []) as AcervoFichaRow[],
  };
}

function montarFichaDoAcervo(row: AcervoFichaRow): FichaCompleta | null {
  if (!row.dados) return null;
  const ficha = row.dados;
  ficha.identidade.edicao_liberada = row.edicao_liberada;
  ficha.identidade.acesso_mercado_epico = row.acesso_mercado_epico;
  ficha.identidade.acesso_mercado_arcano = row.acesso_mercado_arcano ?? true;
  ficha.identidade.acesso_mercado_lendario = row.acesso_mercado_lendario ?? false;
  ficha.identidade.pode_comprar = row.pode_comprar ?? true;
  ficha.identidade.tenant_id = row.tenant_id;
  return ficha;
}

async function acervoDoCliente(tenantId: string): Promise<AcervoBase> {
  if (cacheAcervo && cacheAcervo.tenantId === tenantId && Date.now() - cacheAcervo.at < ACERVO_TTL_MS) {
    return cacheAcervo.base;
  }
  const base = await carregarAcervoBase(tenantId);
  cacheAcervo = { tenantId, at: Date.now(), base };
  return base;
}

async function acervoResumoDoCliente(tenantId: string): Promise<AcervoResumo> {
  if (cacheAcervoResumo && cacheAcervoResumo.tenantId === tenantId && Date.now() - cacheAcervoResumo.at < ACERVO_TTL_MS) {
    return cacheAcervoResumo.base;
  }
  const [charactersResult, fichasResult] = await Promise.all([
    supabase
      .from('characters')
      .select('id, nome, created_by, imagem_url, large_image_url, letter, is_known, quote, quote_source, descricao')
      .eq('tenant_id', tenantId)
      .order('ordem', { ascending: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true }),
    supabase
      .from('fichas')
      .select('character_id, edicao_liberada, acesso_mercado_epico, acesso_mercado_arcano, acesso_mercado_lendario, pode_comprar, nome_personagem:dados->identidade->>nome_personagem, imagem_url:dados->identidade->>imagem_url, historia:dados->identidade->>historia, raca:dados->identidade->>raca, nivel:dados->identidade->>nivel, xp:dados->identidade->>xp, dinheiro:dados->recursos->>dinheiro, vida_atual:dados->status->>vida_atual, vida_max:dados->status->>vida_max, vigor_atual:dados->status->>vigor_atual, vigor_max:dados->status->>vigor_max, north:dados->status->>north')
      .eq('tenant_id', tenantId),
  ]);
  if (charactersResult.error) throw new Error('Não foi possível carregar o acervo: ' + charactersResult.error.message);
  if (fichasResult.error) throw new Error('Não foi possível carregar as fichas: ' + fichasResult.error.message);
  const base: AcervoResumo = {
    characters: (charactersResult.data ?? []) as AcervoCharacterRow[],
    fichas: (fichasResult.data ?? []) as FichaResumoRow[],
  };
  cacheAcervoResumo = { tenantId, at: Date.now(), base };
  return base;
}

export const fichaService = {
  invalidarCacheAcervo,

  getFicha: async (characterId: string): Promise<FichaCompleta> => {
    const session = useSessionStore.getState().session;
    const tenantId = session?.user.tenant_id;
    if (tenantId && cacheAcervo?.tenantId === tenantId && Date.now() - cacheAcervo.at < ACERVO_TTL_MS) {
      const row = cacheAcervo.base.fichas.find((ficha) => ficha.character_id === characterId);
      if (row && row.tenant_id === tenantId) {
        const ficha = montarFichaDoAcervo(row);
        if (ficha) return ficha;
      }
    }

    let fichaQuery = supabase
      .from('fichas')
      .select('tenant_id, edicao_liberada, acesso_mercado_epico, acesso_mercado_arcano, acesso_mercado_lendario, pode_comprar, dados')
      .eq('character_id', characterId);
    if (tenantId) fichaQuery = fichaQuery.eq('tenant_id', tenantId);
    const { data, error } = await fichaQuery.maybeSingle();
    if (error) throw new Error('Não foi possível carregar a ficha: ' + error.message);

    if (data) {
      const ficha = data.dados as FichaCompleta;
      ficha.identidade.edicao_liberada = data.edicao_liberada;
      ficha.identidade.acesso_mercado_epico = data.acesso_mercado_epico;
      ficha.identidade.acesso_mercado_arcano = data.acesso_mercado_arcano ?? true;
      ficha.identidade.acesso_mercado_lendario = data.acesso_mercado_lendario ?? false;
      ficha.identidade.pode_comprar = data.pode_comprar ?? true;
      ficha.identidade.tenant_id = data.tenant_id;
      return ficha;
    }

    // Personagens sem ficha salva começam sempre com a ficha em branco.
    return fichaService.createBlankFicha(characterId, '');
  },

  /**
   * Garante que a ficha exista no banco antes de operações que exigem a linha
   * (concessão de XP e ajuste de tesouro). Cria uma ficha em branco quando faltar.
   */
  ensureFicha: async (characterId: string): Promise<FichaCompleta> => {
    const tenantId = useSessionStore.getState().session?.user.tenant_id;
    if (!tenantId) throw new Error('Não foi possível preparar a ficha: escopo de cliente indefinido.');
    const { data: existingFicha, error: fichaError } = await supabase
      .from('fichas')
      .select('character_id')
      .eq('character_id', characterId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (fichaError) throw new Error('Não foi possível verificar a ficha: ' + fichaError.message);
    if (existingFicha) return fichaService.getFicha(characterId);

    const { data: character, error: characterError } = await supabase
      .from('characters')
      .select('nome')
      .eq('id', characterId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    if (characterError) throw new Error('Não foi possível carregar o personagem: ' + characterError.message);

    const ficha = fichaService.createBlankFicha(characterId, character?.nome ?? '');
    const saved = await fichaService.saveFicha(characterId, ficha);
    if (!saved) throw new Error('Não foi possível preparar a ficha do personagem.');
    return ficha;
  },

  grantXp: async (characterId: string, amount: number, reason: string): Promise<void> => {
    const { error } = await supabase.rpc('grant_xp', { p_character_id: characterId, p_amount: amount, p_reason: reason });
    if (error) throw new Error('Não foi possível conceder XP: ' + error.message);
    invalidarCacheAcervo();
  },

  adjustTreasure: async (characterId: string, delta: number): Promise<void> => {
    const { error } = await supabase.rpc('adjust_treasure', { p_character_id: characterId, p_delta: delta });
    if (error) throw new Error('Não foi possível ajustar o tesouro: ' + error.message);
    invalidarCacheAcervo();
  },

  /**
   * Lista os personagens acessíveis ao usuário: apenas os do seu cliente (tenant).
   * O administrador da plataforma não possui acervo próprio e usa o painel administrativo.
   */
  getListaPersonagens: async (): Promise<Array<{ id: string; nome: string; raca?: string; nivel?: number; imagem_url?: string; dinheiro: number; ownerId: string | null }>> => {
    const scope = currentScope();
    if (!scope) return [];

    const base = await acervoResumoDoCliente(scope.tenantId);
    const fichasPorPersonagem = new Map<string, FichaResumoRow>();
    base.fichas.forEach((row) => fichasPorPersonagem.set(row.character_id, row));

    return base.characters.map((character) => {
      const ficha = fichasPorPersonagem.get(character.id);
      const nomePersonagem = ficha?.nome_personagem?.trim();
      return {
        id: character.id,
        nome: nomePersonagem || character.nome || 'Aventureiro',
        raca: ficha?.raca || 'Aventureiro',
        nivel: Number(ficha?.nivel) || 1,
        imagem_url: ficha?.imagem_url || character.imagem_url || undefined,
        dinheiro: Number(ficha?.dinheiro) || 0,
        ownerId: character.created_by,
      };
    });
  },

  /** Resumo leve da mesa para o Painel do Mestre: uma consulta pequena, sem o jsonb completo. */
  getResumoDaMesa: async (): Promise<MesaResumo[]> => {
    const scope = currentScope();
    if (!scope) return [];
    const base = await acervoResumoDoCliente(scope.tenantId);
    return base.characters.map((character) => {
      const ficha = base.fichas.find((row) => row.character_id === character.id);
      const nome = ficha?.nome_personagem?.trim() || character.nome || 'Aventureiro';
      const numeros = [
        ficha?.vida_atual ?? null,
        ficha?.vida_max ?? null,
        ficha?.vigor_atual ?? null,
        ficha?.vigor_max ?? null,
        ficha?.north ?? null,
      ];
      const temStatus = numeros.every((valor) => valor !== null);
      return {
        id: character.id,
        nome,
        imagemUrl: ficha?.imagem_url || character.imagem_url || undefined,
        nivel: Number(ficha?.nivel) || 1,
        xp: Number(ficha?.xp) || 0,
        dinheiro: Number(ficha?.dinheiro) || 0,
        edicaoLiberada: ficha?.edicao_liberada ?? true,
        acessoMercadoEpico: ficha?.acesso_mercado_epico ?? false,
        ownerId: character.created_by,
        podeComprar: ficha?.pode_comprar ?? true,
        acessoMercadoArcano: ficha?.acesso_mercado_arcano ?? true,
        acessoMercadoLendario: ficha?.acesso_mercado_lendario ?? false,
        status: temStatus
          ? {
              vidaAtual: Number(ficha?.vida_atual) || 0,
              vidaMax: Number(ficha?.vida_max) || 0,
              vigorAtual: Number(ficha?.vigor_atual) || 0,
              vigorMax: Number(ficha?.vigor_max) || 0,
              north: Number(ficha?.north) || 0,
            }
          : null,
      } satisfies MesaResumo;
    });
  },

  /**
   * Mesa completa com o motor de cálculo aplicado — usado em segundo plano pelo
   * Painel do Mestre para revalidar os vitais. Fica no serviço para o
   * pré-aquecimento usar exatamente o mesmo caminho.
   */
  getMesaCompleta: async (): Promise<Map<string, FichaCompleta>> => {
    const list = await fichaService.getListaPersonagens();
    const fichasPorPersonagem = await fichaService.getFichasDoAcervo();
    const resultado = new Map<string, FichaCompleta>();
    list.forEach((character) => {
      try {
        const base = fichasPorPersonagem.get(character.id) ?? fichaService.createBlankFicha(character.id, character.nome);
        resultado.set(character.id, fichaService.calcularEngine(base));
      } catch {
        // Ficha inválida é ignorada; a linha continua visível com os dados do resumo.
      }
    });
    return resultado;
  },

  /** Fichas completas do cliente reaproveitando o acervo já carregado. */
  getFichasDoAcervo: async (): Promise<Map<string, FichaCompleta>> => {
    const scope = currentScope();
    if (!scope) return new Map();
    const base = await acervoDoCliente(scope.tenantId);
    const fichas = new Map<string, FichaCompleta>();
    base.fichas.forEach((row) => {
      if (row.dados) fichas.set(row.character_id, row.dados);
    });
    return fichas;
  },

  /** Contagem de fichas por cliente em uma única consulta (evita uma requisição por cliente). */
  contarFichasPorCliente: async (): Promise<Record<string, number>> => {
    const { data, error } = await supabase.rpc('contar_fichas_por_cliente');
    if (error) throw new Error(`Não foi possível contar as fichas: ${error.message}`);
    const contagens: Record<string, number> = {};
    ((data ?? []) as Array<{ tenant_id: string; total: number }>).forEach((row) => {
      contagens[row.tenant_id] = Number(row.total) || 0;
    });
    return contagens;
  },

  contarFichasPorJogador: async (): Promise<Record<string, number>> => {
    const scope = currentScope();
    if (!scope) return {};
    const base = await acervoResumoDoCliente(scope.tenantId);
    const contagens: Record<string, number> = {};
    base.characters.forEach((character) => {
      if (!character.created_by) return;
      contagens[character.created_by] = (contagens[character.created_by] ?? 0) + 1;
    });
    return contagens;
  },

  createBlankFicha: (
    characterId: string,
    characterName = '',
    scope?: { tenantId?: string; userId?: string }
  ): FichaCompleta => {
    const resolvedScope = currentScope();
    return {
      identidade: {
        id: `ficha-${characterId}`,
        user_id: scope?.userId || resolvedScope?.userId || '',
        tenant_id: scope?.tenantId || resolvedScope?.tenantId,
        nome_personagem: characterName,
        imagem_url: undefined,
        raca: '',
        nivel: 1,
        pts: 0,
        xp: 0,
        cor_aura: '#a88d61',
        edicao_liberada: true,
        acesso_mercado_epico: false,
        acesso_mercado_arcano: true,
        acesso_mercado_lendario: false,
        pode_comprar: true,
        historia: '',
      },
      atributos: {
        ficha_id: `ficha-${characterId}`,
        for: { valor_base: 0, extra: 0, perda: 0 },
        agi: { valor_base: 0, extra: 0, perda: 0 },
        comb: { valor_base: 0, extra: 0, perda: 0 },
        pont: { valor_base: 0, extra: 0, perda: 0 },
        int: { valor_base: 0, extra: 0, perda: 0 },
        sab: { valor_base: 0, extra: 0, perda: 0 },
        vit: { valor_base: 0, extra: 0, perda: 0 },
        car: { valor_base: 0, extra: 0, perda: 0 },
        art: { valor_base: 0, extra: 0, perda: 0 },
        alm: { valor_base: 0, extra: 0, perda: 0 },
      },
      status: {
        ficha_id: `ficha-${characterId}`,
        vida_max: 0,
        vida_atual: 0,
        energia_max: 0,
        energia_atual: 0,
        vigor_max: 0,
        vigor_atual: 0,
        folego: 0,
        north: 0,
      },
      recursos: {
        ficha_id: `ficha-${characterId}`,
        dinheiro: 0,
        outros: '',
        outros_valor: 0,
        carga_total_peso: 0,
        carga_status: 'Normal',
      },
      defesas: {
        ficha_id: `ficha-${characterId}`,
        esquiva: 0,
        aparar: 0,
        bloquear: 0,
        bloquear_magico: 0,
        reflexo: 0,
        sanidade: 0,
        coragem: 0,
        imunidade: 0,
        constituicao: 0,
        percepcao: 0,
      },
      treinamentos: [],
      suporte: {
        mult_vida: 2,
        dano_natural: 0,
        vel_basica: 0,
        deslocamento: 0,
        talentos: '',
        desvantagens: '',
        especializacao: '',
        anotacoes: '',
        grimorio_pagina1: '',
        grimorio_pagina2: '',
        armadura: {
          elmo: 0,
          gorjal: 0,
          couraca: 0,
          bracal: 0,
          manoplas: 0,
          coxote: 0,
          calca: 0,
          grevas: 0,
        },
        montaria: {
          nome: '',
          raca: '',
          tipo: '',
          peso: 0,
          velocidade: '',
          habilidades: '',
          requisitos: '',
          descricao: '',
          cabeca: 0,
          tronco: 0,
          superiores: 0,
          inferiores: 0,
        },
        armamento: {
          arma_primaria: { nome: '', dano: '', dano_arma: '', dano_total: '', resist: 0, peso: 0, efeito: '' },
          segunda_arma: { nome: '', dano: '', dano_arma: '', dano_total: '', resist: 0, peso: 0, efeito: '' },
          arma_suporte: { nome: '', dano: '', dano_arma: '', dano_total: '', resist: 0, peso: 0, efeito: '' },
          arco_ld: { nome: '', dano: '', dano_flecha: '', dano_total: '', prec: 0, tensao: 0, peso: 0, efeito: '' },
        },
        inventario: [],
        ext_per: {
          north_ext: 0,
          north_per: 0,
          vida_ext: 0,
          vida_per: 0,
          vigor_ext: 0,
          vigor_per: 0,
        }
      }
    };
  },

  saveFicha: async (characterId: string, ficha: FichaCompleta): Promise<boolean> => {
    const session = useSessionStore.getState().session;
    const tenantId = ficha.identidade.tenant_id ?? session?.user.tenant_id ?? await findCharacterTenant(characterId);
    if (!tenantId) {
      console.error('Não foi possível salvar a ficha: escopo de cliente indefinido.');
      return false;
    }

    const {
      edicao_liberada,
      acesso_mercado_epico,
      acesso_mercado_arcano,
      acesso_mercado_lendario,
      pode_comprar,
      ...identidade
    } = ficha.identidade;
    const { identidade: _fichaIdentidade, ...restoFicha } = ficha;
    const dados = { ...restoFicha, identidade };
    const row: Record<string, unknown> = {
      character_id: characterId,
      tenant_id: tenantId,
      dados,
      created_by: session?.user.id ?? null,
    };
    if (session?.user.role === 'mestre' || session?.user.role === 'admin') {
      row.edicao_liberada = edicao_liberada;
      row.acesso_mercado_epico = acesso_mercado_epico;
      row.acesso_mercado_arcano = acesso_mercado_arcano;
      row.acesso_mercado_lendario = acesso_mercado_lendario;
      row.pode_comprar = pode_comprar;
    }

    const { error } = await supabase.from('fichas').upsert(row, { onConflict: 'character_id' });
    if (error) {
      console.error('Erro ao salvar ficha:', error);
      return false;
    }
    invalidarCacheAcervo();
    invalidateAsyncDataCache(cacheKeyPrefixes.acervoPersonagens);
    invalidateAsyncDataCache(cacheKeyPrefixes.mestreFichas);
    invalidateAsyncDataCache(cacheKeys.personagensResumo(tenantId));
    return true;
  },

  /** Acervo de personagens do cliente, com os dados das fichas salvas hidratados. */
  getTenantCharacters: async (): Promise<TenantCharacter[]> => {
    const scope = currentScope();
    if (!scope) return [];

    const base = await acervoResumoDoCliente(scope.tenantId);
    const fichasPorPersonagem = new Map<string, FichaResumoRow>();
    base.fichas.forEach((row) => fichasPorPersonagem.set(row.character_id, row));

    return base.characters.map((row) => {
      const character: TenantCharacter = {
        id: row.id,
        name: row.nome,
        image: row.imagem_url,
        ownerId: row.created_by ?? undefined,
        largeImage: row.large_image_url ?? undefined,
        letter: row.letter ?? row.nome.charAt(0).toUpperCase() ?? '?',
        isKnown: row.is_known,
        quote: row.quote ?? undefined,
        quoteSource: row.quote_source ?? undefined,
        description: row.descricao ?? undefined,
      };
      const ficha = fichasPorPersonagem.get(row.id);
      if (!ficha) return character;

      const nome = ficha.nome_personagem?.trim();
      const imagem = ficha.imagem_url;
      return {
        ...character,
        name: nome || character.name,
        letter: (nome || character.name).charAt(0).toUpperCase(),
        image: imagem || character.image,
        largeImage: imagem || character.largeImage,
        description: ficha.historia
          ? [ficha.historia]
          : character.description,
      };
    });
  },

  createTenantCharacter: async (character: TenantCharacter): Promise<TenantCharacter> => {
    const scope = currentScope();
    if (!scope) throw new Error('Não foi possível criar o personagem: escopo de cliente indefinido.');
    const { data: maxRows, error: maxError } = await supabase
      .from('characters')
      .select('ordem')
      .eq('tenant_id', scope.tenantId)
      .order('ordem', { ascending: false })
      .limit(1);
    if (maxError) throw new Error('Não foi possível ordenar o personagem: ' + maxError.message);
    const ordem = ((maxRows?.[0]?.ordem as number | undefined) ?? 0) + 1;
    const { error } = await supabase.from('characters').insert({
      id: character.id,
      tenant_id: scope.tenantId,
      created_by: useSessionStore.getState().session?.user.id ?? null,
      nome: character.name,
      imagem_url: character.image,
      large_image_url: character.largeImage ?? null,
      letter: character.letter,
      is_known: character.isKnown,
      quote: character.quote ?? null,
      quote_source: character.quoteSource ?? null,
      descricao: character.description ?? null,
      ordem,
    });
    if (error) throw new Error('Não foi possível criar o personagem: ' + error.message);
    invalidarCacheAcervo();
    return character;
  },

  removeTenantCharacter: async (characterId: string): Promise<void> => {
    const tenantId = useSessionStore.getState().session?.user.tenant_id;
    if (!tenantId) return;
    const { error } = await supabase.from('characters').delete().eq('id', characterId).eq('tenant_id', tenantId);
    if (error) throw new Error('Não foi possível remover o personagem: ' + error.message);
    invalidarCacheAcervo();
  },

  // Motor de Automação Angarden (Engine de Cálculos)
  calcularEngine: (ficha: FichaCompleta): FichaCompleta => {
    const clone: FichaCompleta = structuredClone(ficha);

    const getVal = (attr: { valor_base: number; extra: number; perda: number }) =>
      (Number(attr.valor_base) || 0) + (Number(attr.extra) || 0) - (Number(attr.perda) || 0);

    const forEff = getVal(clone.atributos.for);
    const agiEff = getVal(clone.atributos.agi);
    const combEff = getVal(clone.atributos.comb);
    const pontEff = getVal(clone.atributos.pont);
    const intEff = getVal(clone.atributos.int);
    const sabEff = getVal(clone.atributos.sab);
    const vitEff = getVal(clone.atributos.vit);
    const carEff = getVal(clone.atributos.car);
    const artEff = getVal(clone.atributos.art);
    const almEff = getVal(clone.atributos.alm);

    const nivel = Number(clone.identidade.nivel) || 1;
    const multVida = Number(clone.suporte.mult_vida) || 2;

    // 1. Status Vitais
    const vidaMaxCalculada = Math.floor(vitEff * multVida);
    const vigorMaxCalculado = Math.floor((forEff + vitEff) / 2);
    const energiaMaxCalculada = vigorMaxCalculado;
    const folegoCalculado = Math.floor(vigorMaxCalculado / 2);
    const norfhCalculado = Math.floor(almEff + nivel);

    clone.status.vida_max = vidaMaxCalculada;
    clone.status.vigor_max = vigorMaxCalculado;
    clone.status.energia_max = energiaMaxCalculada;
    clone.status.folego = folegoCalculado;
    clone.status.north = norfhCalculado;

    // 1.1 Automação de Cálculos das Maestrias e Treinamentos (NH = Atributo Correspondente + GRAD)
    if (clone.treinamentos && Array.isArray(clone.treinamentos)) {
      clone.treinamentos = clone.treinamentos.map((t) => {
        const grad = Number(t.graduacao) || 0;
        let baseAttr = 0;

        if (t.categoria === 'Maestria') {
          if (t.tipo === 'COMB') baseAttr = combEff;
          else if (t.tipo === 'PONT') baseAttr = pontEff;
          else if (t.tipo === 'MAGIA' || t.tipo === 'ESCUDO_MAGICO' || t.tipo === 'ESC_MAG') baseAttr = intEff;
          else if (t.tipo === 'ESCUDO' || t.tipo === 'ESC') baseAttr = combEff;
          else baseAttr = combEff;
        } else if (t.categoria === 'Habilidade') {
          if (t.tipo === 'AGI') baseAttr = agiEff;
          else if (t.tipo === 'INT') baseAttr = intEff;
          else if (t.tipo === 'CAR') baseAttr = carEff;
          else if (t.tipo === 'ART') baseAttr = artEff;
          else baseAttr = 10;
        } else {
          baseAttr = 10;
        }

        const nhCalculado = baseAttr + grad;
        return {
          ...t,
          nh_calculado: nhCalculado,
        };
      });
    }

    // 2. Peso e Carga (Mercadorias no inventário NÃO contabilizam peso; apenas equipamentos ativos equipados na ficha)
    const parsePeso = (p: any) => {
      if (typeof p === 'number') return isNaN(p) ? 0 : p;
      if (typeof p === 'string') {
        const cleaned = p.replace(',', '.').replace(/[^0-9.-]/g, '');
        const val = parseFloat(cleaned);
        return isNaN(val) ? 0 : val;
      }
      return 0;
    };

    const armamentos = clone.suporte.armamento || ({} as any);
    const pesoArmas = parsePeso(armamentos.arma_primaria?.peso)
      + parsePeso(armamentos.segunda_arma?.peso)
      + parsePeso(armamentos.arma_suporte?.peso)
      + parsePeso(armamentos.arco_ld?.peso ?? armamentos.arco?.peso);
    const pesoArmadura = parsePeso(clone.suporte.armadura?.peso);
    const pesoTotal = parseFloat((pesoArmas + pesoArmadura).toFixed(1));
    clone.recursos.carga_total_peso = pesoTotal;

    let penalidadeCarga = 0;
    let statusCarga: 'Normal' | 'Leve' | 'Média' | 'Pesada' | 'Muito Pesada' = 'Normal';

    if (pesoTotal <= forEff) {
      penalidadeCarga = 0;
      statusCarga = 'Normal';
    } else if (pesoTotal <= 2 * forEff) {
      penalidadeCarga = 1;
      statusCarga = 'Leve';
    } else if (pesoTotal <= 3 * forEff) {
      penalidadeCarga = 2;
      statusCarga = 'Média';
    } else if (pesoTotal <= 6 * forEff) {
      penalidadeCarga = 3;
      statusCarga = 'Pesada';
    } else {
      penalidadeCarga = 4;
      statusCarga = 'Muito Pesada';
    }

    clone.recursos.carga_status = statusCarga;

    // 3. Mobilidade e Dano
    const extPer = (clone.suporte.ext_per as any) || {};
    const danoNaturalMod = Number(extPer.dano_natural_ext) || 0;
    const deslocamentoMod = Number(extPer.deslocamento_ext) || 0;

    const velBasica = Math.floor((forEff + agiEff) / 4);
    const deslocamentoFinal = Math.max(0, velBasica - penalidadeCarga + deslocamentoMod);
    const danoNatural = forEff + nivel + danoNaturalMod;

    clone.suporte.vel_basica = velBasica;
    clone.suporte.deslocamento = deslocamentoFinal;
    clone.suporte.dano_natural = danoNatural;

    // Recalcula o Dano Total das Armas Corpo a Corpo (Dano da Arma + Dano Natural) e ARCO (Tensão + Flecha)
    if (clone.suporte.armamento) {
      const meleeKeys: Array<'arma_primaria' | 'segunda_arma' | 'arma_suporte'> = ['arma_primaria', 'segunda_arma', 'arma_suporte'];
      meleeKeys.forEach((key) => {
        const weapon = clone.suporte.armamento[key];
        if (weapon) {
          const rawArma = weapon.dano_arma ?? weapon.dano ?? '';
          const danoArmaNum = parseInt(String(rawArma).replace(/[^0-9-]/g, ''), 10);
          if (!isNaN(danoArmaNum) && String(rawArma).trim() !== '') {
            if (weapon.categoria === 'Escudo' && danoArmaNum === 0) {
              weapon.dano_total = '0';
            } else {
              weapon.dano_total = String(danoArmaNum + danoNatural);
            }
          }
        }
      });

      const arco = clone.suporte.armamento.arco_ld;
      if (arco) {
        const rawFlecha = arco.dano_flecha ?? arco.dano ?? '';
        const flechaNum = parseInt(String(rawFlecha).replace(/[^0-9-]/g, ''), 10);
        const tensaoNum = Number(arco.tensao) || 0;
        if (!isNaN(flechaNum) && String(rawFlecha).trim() !== '') {
          arco.dano_total = String(tensaoNum + flechaNum);
        }
      }
    }

    // 4. Defesas & Resistências
    // Modificadores de Resistências (células menores)
    const reflexoMod = Number(extPer.reflexo_ext) || 0;
    const sanidadeMod = Number(extPer.sanidade_ext) || 0;
    const imunidadeMod = Number(extPer.imunidade_ext) || 0;
    const percepcaoMod = Number(extPer.percepcao_ext) || 0;
    const coragemMod = Number(extPer.coragem_ext) || 0;
    const constituicaoMod = Number(extPer.constituicao_ext) || 0;

    // Resistências
    const sanidadeBase = Math.floor((intEff + vitEff) / 2);
    const coragemBase = Math.floor((sanidadeBase + vitEff) / 5);
    const imunidadeBase = Math.floor((Math.sqrt(Math.max(0, forEff)) + Math.sqrt(Math.max(0, vitEff))) / 2);
    const constituicaoBase = Math.floor(Math.sqrt(Math.max(0, forEff)) + Math.sqrt(Math.min(20, Math.max(0, vitEff))));
    const reflexoBase = Math.floor((agiEff + combEff) / 2);
    const percepcaoBase = Math.floor((sabEff + intEff) / 2);

    clone.defesas.sanidade = sanidadeBase + sanidadeMod;
    clone.defesas.coragem = coragemBase + coragemMod;
    clone.defesas.imunidade = imunidadeBase + imunidadeMod;
    clone.defesas.constituicao = constituicaoBase + constituicaoMod;
    clone.defesas.reflexo = reflexoBase + reflexoMod;
    clone.defesas.percepcao = percepcaoBase + percepcaoMod;

    // Esquiva, Aparar, Bloquear (com suporte a modificador/bônus/redutor de ext_per)
    const maestriaCombatePrincipal = (clone.treinamentos || []).find((t) => t.tipo === 'COMB')?.nh_calculado || combEff;
    const maestriaMagicaPrincipal = (clone.treinamentos || []).find((t) => t.tipo === 'MAGIA')?.nh_calculado || intEff;
    const maestriaEscudoItem = (clone.treinamentos || []).find((t) => t.tipo === 'ESCUDO' || t.tipo === 'ESC');
    const nhEscudo = maestriaEscudoItem ? Number(maestriaEscudoItem.nh_calculado) || 0 : 0;
    const maestriaEscudoMagicoItem = (clone.treinamentos || []).find((t) => t.tipo === 'ESCUDO_MAGICO' || t.tipo === 'ESC_MAG');
    const nhEscudoMagico = maestriaEscudoMagicoItem ? Number(maestriaEscudoMagicoItem.nh_calculado) || 0 : maestriaMagicaPrincipal;

    const esquivaMod = Number(extPer.esquiva_ext) || 0;
    const apararMod = Number(extPer.aparar_ext) || 0;
    const bloquearMod = Number(extPer.bloquear_ext) || 0;
    const bloquearMagicoMod = Number(extPer.bloquear_magico_ext) || 0;

    // Bônus de Bloqueio por Escudo equipado em arma_suporte ou segunda_arma
    let bonusBloqueioEscudo = 0;
    if (clone.suporte.armamento) {
      const verificarEscudo = (w: any) => {
        if (!w || !w.nome || w.nome === 'Nenhuma' || w.nome === '-') return;
        const ef = String(w.efeito || '');
        const match = ef.match(/\+(\d+)\s*(?:em\s*)?bloqueio/i);
        if (match) {
          bonusBloqueioEscudo += parseInt(match[1], 10);
        } else if (
          w.categoria?.toLowerCase() === 'escudo' ||
          String(w.nome).toLowerCase().includes('escudo')
        ) {
          if (ef.includes('+1')) bonusBloqueioEscudo += 1;
          else if (ef.includes('+2')) bonusBloqueioEscudo += 2;
          else if (ef.includes('+3')) bonusBloqueioEscudo += 3;
          else if (ef.includes('+4')) bonusBloqueioEscudo += 4;
        }
      };
      verificarEscudo(clone.suporte.armamento.arma_suporte);
      verificarEscudo(clone.suporte.armamento.segunda_arma);
    }

    clone.defesas.esquiva = Math.floor(deslocamentoFinal + agiEff / 2) + esquivaMod;
    clone.defesas.aparar = Math.floor(deslocamentoFinal + maestriaCombatePrincipal / 2) + apararMod;
    clone.defesas.bloquear = Math.floor((forEff + nhEscudo) / 2) + bloquearMod + bonusBloqueioEscudo;
    clone.defesas.bloquear_magico = Math.floor((intEff + nhEscudoMagico) / 2) + bloquearMagicoMod;

    // 5. Automação de RD de Armadura com base na Couraça (RD Base)
    // Couraça: 100% | Gorjal, Braçal, Calça: RD/2 | Manoplas, Coxote, Grevas: RD/3 | Elmo: RD/4
    const arm = clone.suporte.armadura;
    if (arm) {
      if (arm.elmo === undefined) arm.elmo = 0;
      if (arm.gorjal === undefined) arm.gorjal = 0;
      if (arm.couraca === undefined) arm.couraca = 0;
      if (arm.bracal === undefined) arm.bracal = 0;
      if (arm.manoplas === undefined) arm.manoplas = 0;
      if (arm.coxote === undefined) arm.coxote = 0;
      if (arm.calca === undefined) arm.calca = 0;
      if (arm.grevas === undefined) arm.grevas = 0;
    }

    const mon = clone.suporte.montaria;
    if (mon) {
      if (mon.cabeca === undefined) mon.cabeca = 0;
      if (mon.tronco === undefined) mon.tronco = 0;
      if (mon.superiores === undefined) mon.superiores = 0;
      if (mon.inferiores === undefined) mon.inferiores = 0;
    }

    return clone;
  }
};
