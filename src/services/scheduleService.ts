import { supabase } from '@/integrations/supabase/client';
import { invalidateAsyncDataCache } from '../hooks/useAsyncData';
import { useSessionStore } from '../store/useSessionStore';
import type { DadosDaSessao, SessaoDaMesa } from '../types';
import { cacheKeyPrefixes } from './cacheKeys';

type SessaoRow = {
  id: string;
  data_hora: string;
  titulo: string;
  pauta: string;
  link_vtt: string | null;
};

const mapearSessao = (linha: SessaoRow): SessaoDaMesa => ({
  id: linha.id,
  dataHora: linha.data_hora,
  titulo: linha.titulo,
  pauta: linha.pauta,
  linkVtt: linha.link_vtt ?? undefined,
});

const obterTenantId = (): string => {
  const tenantId = useSessionStore.getState().session?.user.tenant_id;
  if (!tenantId) throw new Error('Não foi possível acessar as sessões: escopo de cliente indefinido.');
  return tenantId;
};

export const scheduleService = {
  /** A próxima sessão futura da mesa (a mais próxima primeiro), ou null. */
  getProximaSessao: async (): Promise<SessaoDaMesa | null> => {
    const tenantId = obterTenantId();
    const { data, error } = await supabase
      .from('sessions')
      .select('id, data_hora, titulo, pauta, link_vtt')
      .eq('tenant_id', tenantId)
      .gt('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error('Não foi possível carregar a próxima sessão: ' + error.message);
    return data ? mapearSessao(data) : null;
  },

  /** As últimas sessões já realizadas, da mais recente para a mais antiga. */
  listarHistorico: async (limite = 5): Promise<SessaoDaMesa[]> => {
    const tenantId = obterTenantId();
    const { data, error } = await supabase
      .from('sessions')
      .select('id, data_hora, titulo, pauta, link_vtt')
      .eq('tenant_id', tenantId)
      .lte('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: false })
      .limit(limite);

    if (error) throw new Error('Não foi possível carregar o histórico de sessões: ' + error.message);
    return (data ?? []).map(mapearSessao);
  },

  /** Grava a sessão: com `id` atualiza a existente; sem `id` cria uma nova. */
  salvarSessao: async (dados: DadosDaSessao, id?: string): Promise<SessaoDaMesa> => {
    const currentSession = useSessionStore.getState().session;
    const tenantId = currentSession?.user.tenant_id;
    if (!tenantId) {
      throw new Error('Não foi possível salvar a sessão: escopo de cliente indefinido.');
    }

    const linha = {
      tenant_id: tenantId,
      data_hora: dados.dataHora,
      titulo: dados.titulo,
      pauta: dados.pauta,
      link_vtt: dados.linkVtt ?? null,
    };

    const result = id
      ? await supabase
          .from('sessions')
          .update(linha)
          .eq('id', id)
          .eq('tenant_id', tenantId)
          .select('id, data_hora, titulo, pauta, link_vtt')
          .single()
      : await supabase
          .from('sessions')
          .insert({ ...linha, created_by: currentSession.user.id })
          .select('id, data_hora, titulo, pauta, link_vtt')
          .single();

    if (result.error) throw new Error('Não foi possível salvar a sessão: ' + result.error.message);

    invalidateAsyncDataCache(cacheKeyPrefixes.proximaSessao);
    invalidateAsyncDataCache(cacheKeyPrefixes.historicoSessoes);
    return mapearSessao(result.data);
  },
};
