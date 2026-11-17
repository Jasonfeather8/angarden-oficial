import { invalidateAsyncDataCache } from '../hooks/useAsyncData';
import { supabase } from '../integrations/supabase/client';
import { useSessionStore } from '../store/useSessionStore';
import type {
  CategoriaCronica,
  ConviteDaCronicaPreview,
  Cronica,
  CronicaStatus,
  NovaCronica,
  NovaRecompensaCronica,
  NotaDaCronica,
  ObjetivoDaCronica,
  ParticipanteDaCronica,
  RecompensaDaCronica,
  SituacaoParticipante,
} from '../types';
import { withTimeout } from '../utils/withTimeout';
import { cacheKeyPrefixes } from './cacheKeys';
import { fichaService } from './fichaService';
import { carregarLookupDeItens, consultarLookupDeItens } from './mercadoService';

const COLUNAS_CRONICA = 'id, titulo, data_aventura, local, relato, progresso, personagens, status, agendada_para, capa_url, categoria_id, campanha_id, concluida_em, notas_visiveis, created_by, created_at';
const COLUNAS_OBJETIVO = 'id, titulo, detalhes, imagem_url, concluido, ordem';

type CronicaRow = {
  id: string; titulo: string; data_aventura: string; local: string; relato: string;
  progresso: number; personagens: string[] | null; status: string; agendada_para: string | null;
  capa_url: string | null; categoria_id: string | null; campanha_id: string | null; concluida_em: string | null;
  notas_visiveis: boolean; created_by: string | null; created_at: string;
};

type CategoriaRow = { id: string; nome: string; ordem: number };
type ObjetivoRow = { id: string; titulo: string; detalhes: string | null; imagem_url: string | null; concluido: boolean; ordem: number };
type NotaRow = { id: string; titulo: string; conteudo: string; visivel_jogadores: boolean; created_at: string; autor_id: string | null };
type RecompensaRow = { id: string; objective_id: string | null; tipo: RecompensaDaCronica['tipo']; descricao: string; valor: number | string; quantidade: number | string; item_id: string | null; spell_id: string | null };
type ParticipanteRow = { id: string; user_id: string; character_id: string; nome_personagem: string; nome_jogador: string; status: SituacaoParticipante };
type InvitePreviewRow = { chronicle_id: string; titulo: string; data_aventura: string; local: string; relato: string; cliente: string; mestre: string; ja_participa: boolean };

function tenantId(): string {
  const id = useSessionStore.getState().session?.user.tenant_id;
  if (!id) throw new Error('cliente da sessão não identificado.');
  return id;
}

function usuarioId(): string {
  const id = useSessionStore.getState().session?.user.id;
  if (!id) throw new Error('usuário da sessão não identificado.');
  return id;
}

function mapearCronica(row: CronicaRow): Cronica {
  return {
    id: row.id, titulo: row.titulo, dataAventura: row.data_aventura, local: row.local,
    relato: row.relato, progresso: row.progresso, personagens: row.personagens ?? [],
    status: row.status as CronicaStatus, agendadaPara: row.agendada_para ?? undefined,
    capaUrl: row.capa_url ?? undefined, criadaEm: row.created_at,
    categoriaId: row.categoria_id ?? undefined, campanhaId: row.campanha_id ?? undefined,
    concluidaEm: row.concluida_em ?? undefined,
    notasVisiveis: row.notas_visiveis, criadaPor: row.created_by ?? undefined,
  };
}

function mapearObjetivo(row: ObjetivoRow): ObjetivoDaCronica {
  return {
    id: row.id, titulo: row.titulo, detalhes: row.detalhes ?? '',
    imagemUrl: row.imagem_url ?? undefined, concluido: row.concluido, ordem: row.ordem,
  };
}

function invalidarCache(): void {
  invalidateAsyncDataCache(cacheKeyPrefixes.cronicas);
}

/** Aprovação ou recusa de uma inscrição; só o Mestre autor passa pela RLS. */
async function definirSituacaoDoParticipante(participantId: string, status: SituacaoParticipante): Promise<void> {
  try { tenantId(); } catch (cause) { throw erro('atualizar a situação do participante', String(cause)); }
  const { error } = await withTimeout(Promise.resolve(supabase.rpc('set_chronicle_participant_status', {
    p_participant_id: participantId, p_status: status,
  })));
  if (error) throw erro('atualizar a situação do participante', error.message);
  invalidarCache();
}

function erro(acao: string, message: string): Error {
  return new Error(`Não foi possível ${acao}: ${message}`);
}

/**
 * Crônicas do cliente + crônicas em que o usuário foi inscrito por convite
 * (o convidado pode pertencer a outro cliente; a RLS decide o que ele enxerga).
 */
async function listarCronicas(limite?: number): Promise<Cronica[]> {
  let clienteId: string;
  try { clienteId = tenantId(); }
  catch (cause) { throw erro('carregar as crônicas', cause instanceof Error ? cause.message : String(cause)); }

  const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicles')
    .select(COLUNAS_CRONICA).eq('tenant_id', clienteId)
    .order('data_aventura', { ascending: false }).order('created_at', { ascending: false })));
  if (error) throw erro('carregar as crônicas', error.message);
  const doCliente = (data ?? []) as unknown as CronicaRow[];

  const { data: inscricoes, error: erroInscricoes } = await withTimeout(Promise.resolve(
    supabase.from('chronicle_participants').select('chronicle_id').eq('user_id', usuarioId())
  ));
  if (erroInscricoes) throw erro('carregar as crônicas', erroInscricoes.message);

  const conhecidas = new Set(doCliente.map((row) => row.id));
  const convidadas = [...new Set((inscricoes ?? []).map((row) => row.chronicle_id as string))]
    .filter((id) => !conhecidas.has(id));

  let externas: CronicaRow[] = [];
  if (convidadas.length) {
    const { data: convidadasRows, error: erroConvidadas } = await withTimeout(Promise.resolve(
      supabase.from('chronicles').select(COLUNAS_CRONICA).in('id', convidadas)
    ));
    if (erroConvidadas) throw erro('carregar as crônicas', erroConvidadas.message);
    externas = (convidadasRows ?? []) as unknown as CronicaRow[];
  }

  const todas = [...doCliente, ...externas].sort((a, b) => {
    if (a.data_aventura !== b.data_aventura) return a.data_aventura < b.data_aventura ? 1 : -1;
    return a.created_at < b.created_at ? 1 : -1;
  });

  return (limite !== undefined ? todas.slice(0, limite) : todas).map(mapearCronica);
}

function valoresCronica(dados: NovaCronica, comProgresso = true) {
  return {
    titulo: dados.titulo, data_aventura: dados.dataAventura, local: dados.local, relato: dados.relato,
    ...(comProgresso ? { progresso: dados.progresso } : {}),
    personagens: dados.personagens, status: dados.status,
    agendada_para: dados.agendadaPara ? new Date(dados.agendadaPara).toISOString() : null,
    capa_url: dados.capaUrl ?? null, categoria_id: dados.categoriaId ?? null,
    notas_visiveis: dados.notasVisiveis,
  };
}

export const cronicaService = {
  listar: (): Promise<Cronica[]> => listarCronicas(),
  listarRecentes: (limite = 3): Promise<Cronica[]> => listarCronicas(limite),

  criar: async (dados: NovaCronica): Promise<Cronica> => {
    let clienteId: string;
    let criadorId: string;
    try { clienteId = tenantId(); criadorId = usuarioId(); }
    catch (cause) { throw erro('criar a crônica', cause instanceof Error ? cause.message : String(cause)); }
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicles')
      .insert({ ...valoresCronica(dados), tenant_id: clienteId, created_by: criadorId, campanha_id: dados.campanhaId ?? null })
      .select(COLUNAS_CRONICA).single()));
    if (error) throw erro('criar a crônica', error.message);
    invalidarCache();
    return mapearCronica(data as unknown as CronicaRow);
  },

  atualizar: async (id: string, dados: NovaCronica, comProgresso = true): Promise<Cronica> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('atualizar a crônica', String(cause)); }
    // O vínculo com campanha não é editado pela tela: a coluna fica como está.
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicles')
      .update(valoresCronica(dados, comProgresso)).eq('id', id).eq('tenant_id', clienteId)
      .select(COLUNAS_CRONICA).single()));
    if (error) throw erro('atualizar a crônica', error.message);
    invalidarCache();
    return mapearCronica(data as unknown as CronicaRow);
  },

  excluir: async (id: string): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('excluir a crônica', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicles').delete().eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('excluir a crônica', error.message);
    invalidarCache();
  },

  concluir: async (id: string, concluida: boolean): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('alterar a conclusão da crônica', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicles').update({
      status: concluida ? 'CONCLUIDA' : 'PUBLICADA', concluida_em: concluida ? new Date().toISOString() : null,
    }).eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('alterar a conclusão da crônica', error.message);
    invalidarCache();
  },

  definirNotasVisiveis: async (id: string, visivel: boolean): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('alterar a visibilidade das notas', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicles').update({ notas_visiveis: visivel }).eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('alterar a visibilidade das notas', error.message);
    invalidarCache();
  },

  definirProgresso: async (id: string, progresso: number): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('alterar o progresso', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicles').update({ progresso }).eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('alterar o progresso', error.message);
    invalidarCache();
  },

  listarCategorias: async (): Promise<CategoriaCronica[]> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('carregar as categorias', String(cause)); }
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicle_categories')
      .select('id, nome, ordem').eq('tenant_id', clienteId).order('ordem').order('nome')));
    if (error) throw erro('carregar as categorias', error.message);
    return ((data ?? []) as CategoriaRow[]);
  },

  criarCategoria: async (nome: string): Promise<CategoriaCronica> => {
    let clienteId: string; let criadorId: string;
    try { clienteId = tenantId(); criadorId = usuarioId(); } catch (cause) { throw erro('criar a categoria', String(cause)); }
    const { data: rows, error: listError } = await withTimeout(Promise.resolve(supabase.from('chronicle_categories')
      .select('ordem').eq('tenant_id', clienteId).order('ordem', { ascending: false }).limit(1)));
    if (listError) throw erro('criar a categoria', listError.message);
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicle_categories')
      .insert({ tenant_id: clienteId, created_by: criadorId, nome: nome.trim(), ordem: ((rows?.[0] as { ordem: number } | undefined)?.ordem ?? -1) + 1 })
      .select('id, nome, ordem').single()));
    if (error) throw erro('criar a categoria', error.message);
    invalidarCache();
    return data as CategoriaCronica;
  },

  renomearCategoria: async (id: string, nome: string): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('renomear a categoria', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_categories').update({ nome: nome.trim() }).eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('renomear a categoria', error.message);
    invalidarCache();
  },

  excluirCategoria: async (id: string): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('excluir a categoria', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_categories').delete().eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('excluir a categoria', error.message);
    invalidarCache();
  },

  // As leituras filhas são escopadas por `chronicle_id`: a RLS decide pelo
  // vínculo (cliente do Mestre ou inscrição do convidado), que pode ser de outro cliente.
  listarObjetivos: async (cronicaId: string): Promise<ObjetivoDaCronica[]> => {
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicle_objectives').select(COLUNAS_OBJETIVO)
      .eq('chronicle_id', cronicaId).order('ordem')));
    if (error) throw erro('carregar os objetivos', error.message);
    return ((data ?? []) as unknown as ObjetivoRow[]).map(mapearObjetivo);
  },

  criarObjetivo: async (
    cronicaId: string,
    dados: { titulo: string; detalhes: string; imagemUrl?: string },
  ): Promise<ObjetivoDaCronica> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('criar o objetivo', String(cause)); }
    const { data: rows, error: listError } = await withTimeout(Promise.resolve(supabase.from('chronicle_objectives').select('ordem')
      .eq('chronicle_id', cronicaId).eq('tenant_id', clienteId).order('ordem', { ascending: false }).limit(1)));
    if (listError) throw erro('criar o objetivo', listError.message);
    const ordem = ((rows?.[0] as { ordem: number } | undefined)?.ordem ?? -1) + 1;
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicle_objectives')
      .insert({
        chronicle_id: cronicaId, tenant_id: clienteId, titulo: dados.titulo.trim(),
        detalhes: dados.detalhes.trim(), imagem_url: dados.imagemUrl ?? null, concluido: false, ordem,
      })
      .select(COLUNAS_OBJETIVO).single()));
    if (error) throw erro('criar o objetivo', error.message);
    invalidarCache();
    return mapearObjetivo(data as unknown as ObjetivoRow);
  },

  atualizarObjetivo: async (
    id: string,
    dados: { titulo: string; detalhes: string; imagemUrl?: string },
  ): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('atualizar o objetivo', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_objectives').update({
      titulo: dados.titulo.trim(), detalhes: dados.detalhes.trim(), imagem_url: dados.imagemUrl ?? null,
    }).eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('atualizar o objetivo', error.message);
    invalidarCache();
  },

  alternarObjetivo: async (id: string, concluido: boolean): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('atualizar o objetivo', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_objectives').update({ concluido }).eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('atualizar o objetivo', error.message);
    invalidarCache();
  },

  excluirObjetivo: async (id: string): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('excluir o objetivo', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_objectives').delete().eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('excluir o objetivo', error.message);
    invalidarCache();
  },

  listarNotas: async (cronicaId: string): Promise<NotaDaCronica[]> => {
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicle_notes')
      .select('id, titulo, conteudo, visivel_jogadores, created_at, autor_id').eq('chronicle_id', cronicaId).order('created_at', { ascending: false })));
    if (error) throw erro('carregar as notas', error.message);
    return ((data ?? []) as NotaRow[]).map((row) => ({ id: row.id, titulo: row.titulo, conteudo: row.conteudo,
      visivelJogadores: row.visivel_jogadores, criadaEm: row.created_at, autorId: row.autor_id ?? undefined }));
  },

  criarNota: async (cronicaId: string, dados: Omit<NotaDaCronica, 'id' | 'criadaEm' | 'autorId'>): Promise<NotaDaCronica> => {
    let clienteId: string; let autorId: string;
    try { clienteId = tenantId(); autorId = usuarioId(); } catch (cause) { throw erro('criar a nota', String(cause)); }
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicle_notes').insert({
      chronicle_id: cronicaId, tenant_id: clienteId, autor_id: autorId, titulo: dados.titulo, conteudo: dados.conteudo, visivel_jogadores: dados.visivelJogadores,
    }).select('id, titulo, conteudo, visivel_jogadores, created_at, autor_id').single()));
    if (error) throw erro('criar a nota', error.message);
    invalidarCache();
    const row = data as NotaRow;
    return { id: row.id, titulo: row.titulo, conteudo: row.conteudo, visivelJogadores: row.visivel_jogadores, criadaEm: row.created_at, autorId: row.autor_id ?? undefined };
  },

  atualizarNota: async (id: string, dados: Omit<NotaDaCronica, 'id' | 'criadaEm' | 'autorId'>): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('atualizar a nota', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_notes').update({ titulo: dados.titulo, conteudo: dados.conteudo, visivel_jogadores: dados.visivelJogadores }).eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('atualizar a nota', error.message);
    invalidarCache();
  },

  excluirNota: async (id: string): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('excluir a nota', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_notes').delete().eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('excluir a nota', error.message);
    invalidarCache();
  },

  listarRecompensas: async (cronicaId: string): Promise<RecompensaDaCronica[]> => {
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicle_rewards')
      .select('id, objective_id, tipo, descricao, valor, quantidade, item_id, spell_id').eq('chronicle_id', cronicaId)));
    if (error) throw erro('carregar as recompensas', error.message);
    const rows = (data ?? []) as RecompensaRow[];
    if (rows.length === 0) return [];
    const rewardIds = rows.map((row) => row.id);
    const itemIds = [...new Set(rows.flatMap((row) => row.item_id ? [row.item_id] : []))];
    const spellIds = [...new Set(rows.flatMap((row) => row.spell_id ? [row.spell_id] : []))];
    const [grantsResult, spellsResult] = await Promise.all([
      withTimeout(Promise.resolve(supabase.from('chronicle_reward_grants').select('reward_id, character_id').in('reward_id', rewardIds))),
      spellIds.length ? withTimeout(Promise.resolve(supabase.from('grimorio_spells').select('id, nome').in('id', spellIds))) : Promise.resolve({ data: [], error: null }),
    ]);
    await carregarLookupDeItens(itemIds.map((id) => ({ id })));
    if (grantsResult.error) throw erro('carregar as recompensas', grantsResult.error.message);
    if (spellsResult.error) throw erro('carregar os nomes das magias', spellsResult.error.message);
    const grants = (grantsResult.data ?? []) as { reward_id: string; character_id: string }[];
    const nomesMagias = new Map(((spellsResult.data ?? []) as { id: string; nome: string }[]).map((row) => [row.id, row.nome]));
    return rows.map((row) => {
      const item = row.item_id ? consultarLookupDeItens(row.item_id) : undefined;
      return { id: row.id, objetivoId: row.objective_id ?? undefined, tipo: row.tipo,
        descricao: row.descricao, valor: Number(row.valor), quantidade: Number(row.quantidade),
        itemId: row.item_id ?? undefined, spellId: row.spell_id ?? undefined,
        itemNome: item?.nome, itemImagemUrl: item?.imagem_url, itemIconeTipo: item?.icone_tipo,
        spellNome: row.spell_id ? nomesMagias.get(row.spell_id) : undefined,
        entreguesA: grants.filter((grant) => grant.reward_id === row.id).map((grant) => grant.character_id) };
    });
  },

  criarRecompensa: async (cronicaId: string, dados: NovaRecompensaCronica): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('criar a recompensa', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_rewards').insert({
      chronicle_id: cronicaId, tenant_id: clienteId, objective_id: dados.objetivoId ?? null, tipo: dados.tipo,
      descricao: dados.descricao, valor: dados.valor, quantidade: dados.quantidade,
      item_id: dados.itemId ?? null, spell_id: dados.spellId ?? null,
    })));
    if (error) throw erro('criar a recompensa', error.message);
    invalidarCache();
  },

  atualizarRecompensa: async (id: string, dados: NovaRecompensaCronica): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('atualizar a recompensa', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_rewards').update({
      objective_id: dados.objetivoId ?? null, tipo: dados.tipo, descricao: dados.descricao, valor: dados.valor,
      quantidade: dados.quantidade, item_id: dados.itemId ?? null, spell_id: dados.spellId ?? null,
    }).eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('atualizar a recompensa', error.message);
    invalidarCache();
  },

  excluirRecompensa: async (id: string): Promise<void> => {
    let clienteId: string;
    try { clienteId = tenantId(); } catch (cause) { throw erro('excluir a recompensa', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_rewards').delete().eq('id', id).eq('tenant_id', clienteId)));
    if (error) throw erro('excluir a recompensa', error.message);
    invalidarCache();
  },

  entregarRecompensa: async (rewardId: string, characterIds: string[]): Promise<number> => {
    try { tenantId(); } catch (cause) { throw erro('entregar a recompensa', String(cause)); }
    const { data, error } = await withTimeout(Promise.resolve(supabase.rpc('grant_chronicle_reward', { p_reward_id: rewardId, p_character_ids: characterIds })));
    if (error) throw erro('entregar a recompensa', error.message);
    invalidarCache();
    const result = data as { entregues: number };
    return result.entregues;
  },

  resgatarRecompensa: async (rewardId: string, characterId: string): Promise<void> => {
    try { tenantId(); } catch (cause) { throw erro('resgatar a recompensa', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.rpc('claim_chronicle_reward', { p_reward_id: rewardId, p_character_id: characterId })));
    if (error) throw erro('resgatar a recompensa', error.message);
    invalidarCache();
  },

  listarParticipantes: async (cronicaId: string): Promise<ParticipanteDaCronica[]> => {
    const { data, error } = await withTimeout(Promise.resolve(supabase.from('chronicle_participants')
      .select('id, user_id, character_id, nome_personagem, nome_jogador, status').eq('chronicle_id', cronicaId).order('created_at', { ascending: true })));
    if (error) throw erro('carregar os participantes', error.message);
    const rows = (data ?? []) as unknown as ParticipanteRow[];
    const imagens = await fichaService.imagensDePersonagens(rows.map((row) => row.character_id));
    return rows.map((row) => ({ id: row.id, userId: row.user_id, characterId: row.character_id,
      nomePersonagem: row.nome_personagem, nomeJogador: row.nome_jogador, status: row.status,
      imagemUrl: imagens.get(row.character_id) }));
  },

  inscreverParticipante: async (cronicaId: string, characterId: string, status: SituacaoParticipante = 'aprovado'): Promise<void> => {
    try { tenantId(); } catch (cause) { throw erro('inscrever o participante', String(cause)); }
    const { error } = await withTimeout(Promise.resolve(supabase.rpc('add_chronicle_participant', { p_chronicle_id: cronicaId, p_character_id: characterId, p_status: status })));
    if (error) throw erro('inscrever o participante', error.message);
    invalidarCache();
  },

  aprovarParticipante: (participantId: string): Promise<void> =>
    definirSituacaoDoParticipante(participantId, 'aprovado'),

  recusarParticipante: (participantId: string): Promise<void> =>
    definirSituacaoDoParticipante(participantId, 'recusado'),

  removerParticipante: async (participantId: string): Promise<void> => {
    const { error } = await withTimeout(Promise.resolve(supabase.from('chronicle_participants').delete().eq('id', participantId)));
    if (error) throw erro('remover o participante', error.message);
    invalidarCache();
  },

  criarConvite: async (cronicaId: string): Promise<string> => {
    try { tenantId(); } catch (cause) { throw erro('criar o convite', String(cause)); }
    const { data, error } = await withTimeout(Promise.resolve(supabase.rpc('create_chronicle_invite', { p_chronicle_id: cronicaId })));
    if (error) throw erro('criar o convite', error.message);
    invalidarCache();
    return (data as { token: string }).token;
  },

  previewConvite: async (token: string): Promise<ConviteDaCronicaPreview> => {
    const { data, error } = await withTimeout(Promise.resolve(supabase.rpc('get_chronicle_invite_preview', { p_token: token })));
    if (error) throw erro('carregar o convite', error.message);
    const row = data as InvitePreviewRow;
    return { chronicleId: row.chronicle_id, titulo: row.titulo, dataAventura: row.data_aventura, local: row.local,
      relato: row.relato, cliente: row.cliente, mestre: row.mestre, jaParticipa: row.ja_participa };
  },

  aceitarConvite: async (token: string, characterIds: string[]): Promise<{ chronicleId: string; inscritos: number }> => {
    const { data, error } = await withTimeout(Promise.resolve(supabase.rpc('accept_chronicle_invite', { p_token: token, p_character_ids: characterIds })));
    if (error) throw erro('aceitar o convite', error.message);
    invalidarCache();
    const result = data as { chronicle_id: string; inscritos: number };
    return { chronicleId: result.chronicle_id, inscritos: result.inscritos };
  },

  invalidarCache,
};

export { invalidarCache };
