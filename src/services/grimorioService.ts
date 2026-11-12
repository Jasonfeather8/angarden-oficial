import { supabase } from '@/integrations/supabase/client';
import { GrimorioSpell } from '../mocks/grimorio';
import { useSessionStore } from '../store/useSessionStore';
import { withTimeout } from '../utils/withTimeout';
import { normalizarBusca } from '../utils/normalizarBusca';
import { invalidateAsyncDataCache } from '../hooks/useAsyncData';
import { cacheKeyPrefixes } from './cacheKeys';

const invalidarContagemCatalogo = () => invalidateAsyncDataCache(cacheKeyPrefixes.catalogoDoReino);

export interface ProgressoArcanoFicha {
  characterId: string;
  /** Conta só magias visíveis para quem consulta; porEscola é schoolId → quantidade. */
  aprendidas: number;
  porEscola: Record<string, number>;
}

export const listarProgressoArcano = async (characterIds?: string[]): Promise<ProgressoArcanoFicha[]> => {
  const tenantId = useSessionStore.getState().session?.user.tenant_id ?? null;
  if (!tenantId || characterIds?.length === 0) return [];

  const consulta = supabase.from('spell_progress').select('character_id, spell_id')
    .eq('tenant_id', tenantId).eq('learned', true);
  const { data, error } = await withTimeout(Promise.resolve(
    characterIds ? consulta.in('character_id', characterIds) : consulta
  ));
  if (error) throw new Error('Não foi possível carregar o progresso arcano: ' + error.message);

  const registros = (data ?? []) as unknown as Array<{ character_id: string; spell_id: string }>;
  if (!registros.length) return [];

  const spellIds = [...new Set(registros.map((registro) => registro.spell_id))];
  const escolasPorMagia = new Map<string, string | null>();
  for (let index = 0; index < spellIds.length; index += 200) {
    const lote = spellIds.slice(index, index + 200);
    const { data: magias, error: erroMagias } = await withTimeout(Promise.resolve(
      supabase.from('grimorio_spells').select('id, escola').in('id', lote)
    ));
    if (erroMagias) throw new Error('Não foi possível carregar o progresso arcano: ' + erroMagias.message);
    for (const magia of (magias ?? []) as unknown as Array<{ id: string; escola: string | null }>) {
      escolasPorMagia.set(magia.id, magia.escola);
    }
  }

  const progressoPorFicha = new Map<string, ProgressoArcanoFicha>();
  for (const registro of registros) {
    if (!escolasPorMagia.has(registro.spell_id)) continue;
    const progresso = progressoPorFicha.get(registro.character_id) ?? {
      characterId: registro.character_id,
      aprendidas: 0,
      porEscola: {},
    };
    progresso.aprendidas += 1;
    const escola = escolasPorMagia.get(registro.spell_id);
    if (escola) progresso.porEscola[escola] = (progresso.porEscola[escola] ?? 0) + 1;
    progressoPorFicha.set(registro.character_id, progresso);
  }
  // O Mestre consulta a mesa inteira; o Jogador passa apenas as próprias fichas.
  return [...progressoPorFicha.values()];
};

async function resolveTenantId(characterId: string): Promise<string> {
  const sessionTenantId = useSessionStore.getState().session?.user.tenant_id;
  if (sessionTenantId) return sessionTenantId;

  const { data } = await withTimeout(Promise.resolve(
    supabase.from('characters').select('tenant_id').eq('id', characterId).maybeSingle()
  ));
  if (!data?.tenant_id) throw new Error('Não foi possível identificar o cliente do personagem.');
  return data.tenant_id;
}

const LEARNED_SPELL_IDS_TTL_MS = 60_000;
const learnedSpellIdsCache = new Map<string, { at: number; ids: string[] }>();

export function invalidarCacheMagiasAprendidas(characterId?: string): void {
  if (characterId) {
    learnedSpellIdsCache.delete(characterId);
    return;
  }
  learnedSpellIdsCache.clear();
}

export const getLearnedSpellIds = async (characterId: string): Promise<string[]> => {
  if (!characterId) return [];
  const cached = learnedSpellIdsCache.get(characterId);
  if (cached && Date.now() - cached.at < LEARNED_SPELL_IDS_TTL_MS) return [...cached.ids];
  if (cached) learnedSpellIdsCache.delete(characterId);

  try {
    const { data, error } = await withTimeout(Promise.resolve(
      supabase.from('spell_progress').select('spell_id').eq('character_id', characterId).eq('learned', true)
    ));
    if (error) throw new Error(error.message);
    const ids = (data ?? []).map((row) => row.spell_id);
    learnedSpellIdsCache.set(characterId, { at: Date.now(), ids });
    return [...ids];
  } catch (error) {
    throw new Error('Não foi possível carregar as magias aprendidas: ' + (error instanceof Error ? error.message : String(error)));
  }
};

export const setLearnedSpell = async (characterId: string, spellId: string, learned: boolean): Promise<void> => {
  const tenantId = learned ? await resolveTenantId(characterId) : null;
  try {
    const { error } = learned
      ? await withTimeout(Promise.resolve(supabase.from('spell_progress').upsert(
        { character_id: characterId, tenant_id: tenantId, spell_id: spellId, learned: true },
        { onConflict: 'character_id,spell_id' }
      )))
      : await withTimeout(Promise.resolve(
        supabase.from('spell_progress').delete().eq('character_id', characterId).eq('spell_id', spellId)
      ));
    if (error) throw new Error(error.message);
    invalidarCacheMagiasAprendidas(characterId);
    invalidateAsyncDataCache(cacheKeyPrefixes.progressoArcano);
  } catch (error) {
    throw new Error('Não foi possível atualizar a magia aprendida: ' + (error instanceof Error ? error.message : String(error)));
  }
};

export const mapearMagiaDoRow = (row: { id: string; dados: unknown }): GrimorioSpell => ({
  ...Object.fromEntries(Object.entries((row.dados ?? {}) as Record<string, unknown>).filter(([, value]) => value !== null)),
  id: row.id,
}) as GrimorioSpell;

export const listarMagiasDoVolume = async (
  volumeId: string,
  { page, pageSize }: { page: number; pageSize: number },
): Promise<{ magias: GrimorioSpell[]; ocultas: string[]; total: number }> => {
  const { data, error, count } = await withTimeout(Promise.resolve(
    supabase.from('grimorio_spells')
      .select('id, dados, oculta', { count: 'exact' })
      .eq('dados->>volumeId', volumeId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1)
  ));
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return {
    magias: rows.map(mapearMagiaDoRow),
    ocultas: rows.filter((row) => row.oculta).map((row) => row.id),
    total: count ?? 0,
  };
};

export const buscarMagias = async (
  termo: string,
  { page, pageSize }: { page: number; pageSize: number },
): Promise<{ magias: GrimorioSpell[]; ocultas: string[]; total: number }> => {
  const termoNormalizado = normalizarBusca(termo);
  const { data, error, count } = await withTimeout(Promise.resolve(
    supabase.from('grimorio_spells')
      .select('id, dados, oculta', { count: 'exact' })
      .ilike('busca', `%${termoNormalizado}%`)
      .order('nome', { ascending: true })
      .order('id', { ascending: true })
      .range((page - 1) * pageSize, (page - 1) * pageSize + pageSize - 1)
  ));
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  return {
    magias: rows.map(mapearMagiaDoRow),
    ocultas: rows.filter((row) => row.oculta).map((row) => row.id),
    total: count ?? 0,
  };
};

export const contarMagias = async (): Promise<number> => {
  const { count, error } = await withTimeout(Promise.resolve(
    supabase.from('grimorio_spells').select('id', { count: 'exact', head: true })
  ));
  if (error) throw new Error('Não foi possível contar as magias do grimório: ' + error.message);
  return count ?? 0;
};

export const listarMagiasPorIds = async (
  ids: string[],
): Promise<{ magias: GrimorioSpell[]; ocultas: string[] }> => {
  if (!ids.length) return { magias: [], ocultas: [] };

  const magias: GrimorioSpell[] = [];
  const ocultas: string[] = [];
  for (let index = 0; index < ids.length; index += 200) {
    const lote = ids.slice(index, index + 200);
    const { data, error } = await withTimeout(Promise.resolve(
      supabase.from('grimorio_spells').select('id, dados, oculta').in('id', lote)
    ));
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    magias.push(...rows.map(mapearMagiaDoRow));
    ocultas.push(...rows.filter((row) => row.oculta).map((row) => row.id));
  }
  return { magias, ocultas };
};

/** Limite (em caracteres do base64) acima do qual a imagem é considerada pesada. */
export const LIMITE_IMAGEM_PESADA_BYTES = 300000;

export interface ImagemPesada {
  id: string;
  bytes: number;
}

/** Magias cujo texto de imagem em base64 ainda está grande e deixa a leitura do livro lenta. */
export const listarImagensPesadas = async (
  limiteBytes: number = LIMITE_IMAGEM_PESADA_BYTES,
): Promise<ImagemPesada[]> => {
  const { data, error } = await withTimeout(Promise.resolve(
    supabase.from('grimorio_spells')
      .select('id, imagem_bytes')
      .gt('imagem_bytes', limiteBytes)
      .order('imagem_bytes', { ascending: false })
  ));
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ id: row.id, bytes: row.imagem_bytes ?? 0 }));
};

const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

export const criarMagia = async (spell: GrimorioSpell): Promise<void> => {
  try {
    const { error } = await withTimeout(Promise.resolve(supabase.from('grimorio_spells').insert({
      id: spell.id,
      dados: spell,
      created_by: useSessionStore.getState().session?.user.id ?? null,
    })));
    if (error) throw new Error(error.message);
    invalidarContagemCatalogo();
  } catch (error) {
    throw new Error('Não foi possível criar a magia: ' + errorMessage(error));
  }
};

export const listarIdsExistentes = async (ids: string[]): Promise<Set<string>> => {
  const encontrados = new Set<string>();
  for (let index = 0; index < ids.length; index += 200) {
    const { data, error } = await withTimeout(Promise.resolve(
      supabase.from('grimorio_spells').select('id').in('id', ids.slice(index, index + 200))
    ));
    if (error) throw new Error(`Não foi possível verificar IDs existentes: ${error.message}`);
    for (const row of data ?? []) encontrados.add(row.id);
  }
  return encontrados;
};

export const importarMagias = async (
  linhas: GrimorioSpell[],
  aoProgredir?: (concluidas: number, total: number) => void,
): Promise<{ importadas: number; falhas: string[] }> => {
  const existentes = await listarIdsExistentes(linhas.map((linha) => linha.id));
  const usuarioId = useSessionStore.getState().session?.user.id ?? null;
  const falhas: string[] = [];
  let importadas = 0;
  let concluidas = 0;
  let lote: Array<{ id: string; dados: GrimorioSpell; created_by: string | null }> = [];
  let bytesLote = 2;
  const limiteLote = 600 * 1024;

  const reportarProgresso = () => {
    concluidas += 1;
    aoProgredir?.(concluidas, linhas.length);
  };

  const inserirLote = async () => {
    if (!lote.length) return;
    const atual = lote;
    lote = [];
    bytesLote = 2;
    let motivoLote: string | null = null;
    try {
      const { error } = await withTimeout(Promise.resolve(
        supabase.from('grimorio_spells').insert(atual)
      ));
      motivoLote = error?.message ?? null;
    } catch (error) {
      motivoLote = errorMessage(error);
    }
    if (!motivoLote) {
      importadas += atual.length;
      for (const _linha of atual) reportarProgresso();
      return;
    }

    for (const linha of atual) {
      try {
        const { error } = await withTimeout(Promise.resolve(
          supabase.from('grimorio_spells').insert(linha)
        ));
        if (error) falhas.push(`${linha.id}: ${error.message}`);
        else importadas += 1;
      } catch (error) {
        falhas.push(`${linha.id}: ${errorMessage(error)}`);
      }
      reportarProgresso();
    }
  };

  for (const linha of linhas) {
    if (existentes.has(linha.id)) {
      reportarProgresso();
      continue;
    }

    try {
      const dados: GrimorioSpell = { ...linha };
      if (typeof dados.image === 'string' && dados.image.startsWith('data:image')) {
        const { enviarImagem } = await import('./mediaService');
        dados.image = await withTimeout(enviarImagem(dados.image, 'grimorio'));
      }
      const registro = { id: dados.id, dados, created_by: usuarioId };
      const bytesRegistro = new TextEncoder().encode(JSON.stringify(registro)).byteLength;
      const incremento = bytesRegistro + (lote.length ? 1 : 0);
      if (lote.length && bytesLote + incremento > limiteLote) await inserirLote();
      lote.push(registro);
      bytesLote += bytesRegistro + (lote.length > 1 ? 1 : 0);
    } catch (error) {
      falhas.push(`${linha.id}: ${errorMessage(error)}`);
      reportarProgresso();
    }
  }

  await inserirLote();
  invalidarContagemCatalogo();
  return { importadas, falhas };
};

export const atualizarMagia = async (spell: GrimorioSpell): Promise<void> => {
  try {
    const { error } = await withTimeout(Promise.resolve(
      supabase.from('grimorio_spells').update({ dados: spell }).eq('id', spell.id)
    ));
    if (error) throw new Error(error.message);
  } catch (error) {
    throw new Error('Não foi possível atualizar a magia: ' + errorMessage(error));
  }
};

export const alternarOculta = async (spellId: string, oculta: boolean): Promise<void> => {
  try {
    const { error } = await withTimeout(Promise.resolve(
      supabase.from('grimorio_spells').update({ oculta }).eq('id', spellId)
    ));
    if (error) throw new Error(error.message);
    invalidarContagemCatalogo();
  } catch (error) {
    throw new Error('Não foi possível alterar a visibilidade da magia: ' + errorMessage(error));
  }
};

export const excluirMagia = async (spellId: string): Promise<void> => {
  try {
    const { error } = await withTimeout(Promise.resolve(
      supabase.from('grimorio_spells').delete().eq('id', spellId)
    ));
    if (error) throw new Error(error.message);
    invalidarContagemCatalogo();
  } catch (error) {
    throw new Error('Não foi possível excluir a magia: ' + errorMessage(error));
  }
};
