import { invalidateAsyncDataCache } from '../hooks/useAsyncData';
import { supabase } from '../integrations/supabase/client';
import { useSessionStore } from '../store/useSessionStore';
import type { Cronica, CronicaStatus, NovaCronica } from '../types';
import { cacheKeyPrefixes } from './cacheKeys';

const COLUNAS_CRONICA = 'id, titulo, data_aventura, local, relato, progresso, personagens, status, agendada_para, capa_url, created_at';

type CronicaRow = {
  id: string;
  titulo: string;
  data_aventura: string;
  local: string;
  relato: string;
  progresso: number;
  personagens: string[] | null;
  status: string;
  agendada_para: string | null;
  capa_url: string | null;
  created_at: string;
};

function mapearCronica(row: CronicaRow): Cronica {
  return {
    id: row.id,
    titulo: row.titulo,
    dataAventura: row.data_aventura,
    local: row.local,
    relato: row.relato,
    progresso: row.progresso,
    personagens: row.personagens ?? [],
    status: row.status as CronicaStatus,
    agendadaPara: row.agendada_para ?? undefined,
    capaUrl: row.capa_url ?? undefined,
    criadaEm: row.created_at,
  };
}

async function listarCronicas(limite?: number): Promise<Cronica[]> {
  const tenantId = useSessionStore.getState().session?.user.tenant_id;
  if (!tenantId) throw new Error('Não foi possível carregar as crônicas: cliente da sessão não identificado.');

  let consulta = supabase
    .from('chronicles')
    .select(COLUNAS_CRONICA)
    .eq('tenant_id', tenantId)
    .order('data_aventura', { ascending: false })
    .order('created_at', { ascending: false });
  if (limite !== undefined) consulta = consulta.limit(limite);

  const { data, error } = await consulta;
  if (error) throw new Error('Não foi possível carregar as crônicas: ' + error.message);
  return ((data ?? []) as CronicaRow[]).map(mapearCronica);
}

function invalidarCache(): void {
  invalidateAsyncDataCache(cacheKeyPrefixes.cronicas);
}

export const cronicaService = {
  /** Todas as crônicas visíveis para quem consulta, mais recentes primeiro. */
  listar: (): Promise<Cronica[]> => listarCronicas(),

  /** As `limite` crônicas mais recentes (padrão 3), para o mural do dashboard. */
  listarRecentes: (limite = 3): Promise<Cronica[]> => listarCronicas(limite),

  criar: async (dados: NovaCronica): Promise<Cronica> => {
    const usuario = useSessionStore.getState().session?.user;
    if (!usuario?.tenant_id) {
      throw new Error('Não foi possível criar a crônica: cliente da sessão não identificado.');
    }

    const { data, error } = await supabase
      .from('chronicles')
      .insert({
        tenant_id: usuario.tenant_id,
        created_by: usuario.id,
        titulo: dados.titulo,
        data_aventura: dados.dataAventura,
        local: dados.local,
        relato: dados.relato,
        progresso: dados.progresso,
        personagens: dados.personagens,
        status: dados.status,
        agendada_para: dados.agendadaPara ? new Date(dados.agendadaPara).toISOString() : null,
        capa_url: dados.capaUrl ?? null,
      })
      .select(COLUNAS_CRONICA)
      .single();

    if (error) throw new Error('Não foi possível criar a crônica: ' + error.message);
    invalidarCache();
    return mapearCronica(data as CronicaRow);
  },

  /** Invalida o cache das crônicas (dashboard e tela de Crônicas). */
  invalidarCache,
};
