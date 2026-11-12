import { useSessionStore } from '@/store/useSessionStore';
import { supabase } from '@/integrations/supabase/client';
import { invalidateAsyncDataCache } from '@/hooks/useAsyncData';
import { grimorioElementos, grimorioMentalizacao } from '@/mocks/grimorio';
import { cacheKeys } from './cacheKeys';

export interface GrimorioBloqueios {
  escolas: string[];
  volumes: string[];
}

function getScope(): { tenantId: string; userId: string } {
  const user = useSessionStore.getState().session?.user;
  if (!user?.tenant_id) throw new Error('Não foi possível acessar os bloqueios do Grimório: cliente indefinido.');
  return { tenantId: user.tenant_id, userId: user.id };
}

/**
 * Escolas "guarda-chuva" do Grimório: selar o pai sela também as subescolas dele.
 * A expansão é feita aqui, na escrita, para que a RLS de `grimorio_spells` (que
 * compara o id exato da escola) bloqueie exatamente o que a tela mostra como selado.
 */
function escolasAfetadas(escolaId: string): string[] {
  if (escolaId === 'elementar') return [escolaId, ...grimorioElementos.map((item) => item.id)];
  if (escolaId === 'mentalizacao') return [escolaId, ...grimorioMentalizacao.map((item) => item.id)];
  return [escolaId];
}

export const grimorioBloqueioService = {
  listar: async (): Promise<GrimorioBloqueios> => {
    const { tenantId } = getScope();
    const { data, error } = await supabase
      .from('grimorio_bloqueios')
      .select('escola_id, volume_id')
      .eq('tenant_id', tenantId);
    if (error) throw new Error(`Não foi possível carregar os bloqueios do Grimório: ${error.message}`);
    return {
      escolas: (data ?? []).flatMap((row) => row.escola_id ? [row.escola_id] : []),
      volumes: (data ?? []).flatMap((row) => row.volume_id ? [row.volume_id] : []),
    };
  },

  bloquearEscola: async (escolaId: string): Promise<void> => {
    const { tenantId, userId } = getScope();
    const { error } = await supabase.from('grimorio_bloqueios').upsert(
      escolasAfetadas(escolaId).map((id) => ({ tenant_id: tenantId, escola_id: id, created_by: userId })),
      { onConflict: 'tenant_id,escola_id', ignoreDuplicates: true }
    );
    if (error) throw new Error(`Não foi possível bloquear a escola no Grimório: ${error.message}`);
    invalidateAsyncDataCache(cacheKeys.grimorioBloqueios(tenantId));
  },

  desbloquearEscola: async (escolaId: string): Promise<void> => {
    const { tenantId } = getScope();
    const { error } = await supabase
      .from('grimorio_bloqueios')
      .delete()
      .eq('tenant_id', tenantId)
      .in('escola_id', escolasAfetadas(escolaId));
    if (error) throw new Error(`Não foi possível desbloquear a escola no Grimório: ${error.message}`);
    invalidateAsyncDataCache(cacheKeys.grimorioBloqueios(tenantId));
  },

  bloquearVolume: async (volumeId: string): Promise<void> => {
    const { tenantId, userId } = getScope();
    const { error } = await supabase.from('grimorio_bloqueios').upsert(
      { tenant_id: tenantId, volume_id: volumeId, created_by: userId },
      { onConflict: 'tenant_id,volume_id', ignoreDuplicates: true }
    );
    if (error) throw new Error(`Não foi possível bloquear o volume no Grimório: ${error.message}`);
    invalidateAsyncDataCache(cacheKeys.grimorioBloqueios(tenantId));
  },

  desbloquearVolume: async (volumeId: string): Promise<void> => {
    const { tenantId } = getScope();
    const { error } = await supabase
      .from('grimorio_bloqueios')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('volume_id', volumeId);
    if (error) throw new Error(`Não foi possível desbloquear o volume no Grimório: ${error.message}`);
    invalidateAsyncDataCache(cacheKeys.grimorioBloqueios(tenantId));
  },
};

export default grimorioBloqueioService;
