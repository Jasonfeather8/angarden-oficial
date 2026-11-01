import { useCallback, useEffect, useRef, useState } from 'react';
import { DEFAULT_TIMEOUT_MS, withTimeout } from '../utils/withTimeout';

export interface UseAsyncDataOptions<T> {
  /** Limite de tempo (ms) antes de reportar erro de timeout. */
  timeoutMs?: number;
  /** Regra de negócio para considerar o resultado vazio. */
  isEmpty?: (data: T) => boolean;
  /** Quando false, a busca não é executada. */
  enabled?: boolean;
  /** Chave de cache em memória. Sem ela a busca continua sem cache, como antes. */
  cacheKey?: string;
  /** Validade do valor em cache, em ms. */
  cacheTtlMs?: number;
}

export interface UseAsyncDataResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  reload: () => void;
}

const CACHE_TTL_PADRAO_MS = 60_000;

interface CacheEntry {
  data: unknown;
  at: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Descarta valores em cache. Use depois de criar, editar ou excluir algo para que
 * as telas não voltem a exibir a versão antiga. Sem prefixo, limpa tudo.
 */
export function invalidateAsyncDataCache(prefix?: string): void {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of [...cache.keys()]) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

function defaultIsEmpty<T>(data: T): boolean {
  return Array.isArray(data) && data.length === 0;
}

/**
 * Centraliza o ciclo de vida de uma busca assíncrona expondo os estados de
 * interface (loading, error, empty, success) de forma padronizada.
 *
 * `deps` deve ter sempre o mesmo tamanho entre renderizações.
 */
export function useAsyncData<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
  options: UseAsyncDataOptions<T> = {}
): UseAsyncDataResult<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    isEmpty: isEmptyCheck,
    enabled = true,
    cacheKey,
    cacheTtlMs = CACHE_TTL_PADRAO_MS,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const loaderRef = useRef(loader);
  const isEmptyRef = useRef(isEmptyCheck);
  const requestIdRef = useRef(0);
  const forcarAtualizacaoRef = useRef(false);

  useEffect(() => {
    loaderRef.current = loader;
    isEmptyRef.current = isEmptyCheck;
  });

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    // `reload()` ignora o cache uma vez; as demais trocas de dependência o reaproveitam.
    const forcar = forcarAtualizacaoRef.current;
    forcarAtualizacaoRef.current = false;

    if (cacheKey && !forcar) {
      const entrada = cache.get(cacheKey);
      if (entrada && Date.now() - entrada.at < cacheTtlMs) {
        setData(entrada.data as T);
        setError(null);
        setIsLoading(false);
        return;
      }
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setIsLoading(true);
    setError(null);

    withTimeout(loaderRef.current(), timeoutMs)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (cacheKey) cache.set(cacheKey, { data: result, at: Date.now() });
        setData(result);
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setData(null);
        setError(err instanceof Error ? err.message : 'Não foi possível carregar os dados.');
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setIsLoading(false);
      });

    return () => {
      // Invalida a requisição pendente quando as dependências mudam ou o componente desmonta.
      if (requestId === requestIdRef.current) {
        requestIdRef.current = requestId + 1;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, timeoutMs, reloadToken, cacheKey, cacheTtlMs, ...deps]);

  const reload = useCallback(() => {
    forcarAtualizacaoRef.current = true;
    setReloadToken((token) => token + 1);
  }, []);

  const isEmpty =
    data !== null && (isEmptyRef.current ? isEmptyRef.current(data) : defaultIsEmpty(data));

  return { data, isLoading, error, isEmpty, reload };
}

export default useAsyncData;
