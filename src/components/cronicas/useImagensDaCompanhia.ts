import { useAsyncData } from '@/hooks/useAsyncData';
import { cacheKeys } from '@/services/cacheKeys';
import { fichaService } from '@/services/fichaService';

/** Devolve as imagens da companhia indexadas por nome normalizado. */
export function useImagensDaCompanhia(cronicaId: string, nomes: string[]): Map<string, string> {
  const chaveDeNomes = nomes.join('|');
  const { data } = useAsyncData(
    () => fichaService.imagensPorNomeDePersonagem(nomes),
    [cronicaId, chaveDeNomes],
    { cacheKey: cacheKeys.cronicaCompanhia(cronicaId), enabled: nomes.length > 0 },
  );
  return data ?? new Map<string, string>();
}
