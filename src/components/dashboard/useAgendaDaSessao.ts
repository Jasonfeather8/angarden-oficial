import { useAsyncData } from '../../hooks/useAsyncData';
import { cacheKeys } from '../../services/cacheKeys';
import { scheduleService } from '../../services/scheduleService';

/** Agenda da mesa: a próxima sessão, as presenças dela e o histórico já vivido. */
export function useAgendaDaSessao(tenantId: string | null) {
  const sessaoQuery = useAsyncData(
    () => scheduleService.getProximaSessao(),
    [tenantId],
    { cacheKey: cacheKeys.proximaSessao(tenantId), enabled: Boolean(tenantId) }
  );
  const sessaoId = sessaoQuery.data?.id;
  const presencasQuery = useAsyncData(
    () => scheduleService.listarPresencas(sessaoId as string),
    [sessaoId],
    {
      cacheKey: sessaoId ? cacheKeys.presencasDaSessao(sessaoId) : undefined,
      enabled: Boolean(sessaoId),
    }
  );
  const historicoSessoesQuery = useAsyncData(
    () => scheduleService.listarHistorico(5),
    [tenantId],
    { cacheKey: cacheKeys.historicoSessoes(tenantId), enabled: Boolean(tenantId) }
  );

  return { sessaoQuery, presencasQuery, historicoSessoesQuery };
}
