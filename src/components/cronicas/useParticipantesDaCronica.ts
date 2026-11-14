import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { cronicaService } from '@/services/cronicaService';
import type { ParticipanteDaCronica } from '@/types';

export function useParticipantesDaCronica(cronicaId: string | null) {
  const { data, isLoading, error, reload } = useAsyncData(
    () => cronicaService.listarParticipantes(cronicaId!),
    [cronicaId],
    { cacheKey: cacheKeys.cronicaParticipantes(cronicaId), enabled: Boolean(cronicaId) },
  );
  return { participantes: data ?? [] as ParticipanteDaCronica[], isLoading, error, reload };
}
