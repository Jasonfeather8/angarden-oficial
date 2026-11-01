import { supabase } from '@/integrations/supabase/client';
import { useSessionStore } from '../store/useSessionStore';
import type { ScheduledSession } from '../types';

export const scheduleService = {
  getProximaSessao: async (): Promise<ScheduledSession | null> => {
    const tenantId = useSessionStore.getState().session?.user.tenant_id;
    if (!tenantId) return null;

    const { data, error } = await supabase
      .from('scheduled_sessions')
      .select('data_hora, titulo, pauta, link_vtt')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (error) throw new Error('Não foi possível carregar a sessão agendada: ' + error.message);
    if (!data) return null;

    return {
      dataHora: data.data_hora,
      titulo: data.titulo,
      pauta: data.pauta,
      linkVtt: data.link_vtt ?? undefined,
    };
  },

  salvarProximaSessao: async (session: ScheduledSession): Promise<ScheduledSession> => {
    const currentSession = useSessionStore.getState().session;
    const tenantId = currentSession?.user.tenant_id;
    if (!tenantId) {
      throw new Error('Não foi possível agendar a sessão: escopo de cliente indefinido.');
    }

    const { error } = await supabase.from('scheduled_sessions').upsert(
      {
        tenant_id: tenantId,
        data_hora: session.dataHora,
        titulo: session.titulo,
        pauta: session.pauta,
        link_vtt: session.linkVtt ?? null,
        created_by: currentSession.user.id,
      },
      { onConflict: 'tenant_id' }
    );

    if (error) throw new Error('Não foi possível agendar a sessão: ' + error.message);
    return session;
  },
};
