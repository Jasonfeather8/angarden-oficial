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
  /** Idade a partir da qual o valor em cache será revalidado em segundo plano. */
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

interface RequestState {
  key: string | undefined;
  loading: boolean;
  error: string | null;
}

const cache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<unknown>>();
const cacheClearListeners = new Set<() => void>();
let cacheClearVersion = 0;

function trackInFlightRequest<T>(key: string, request: Promise<T>): Promise<T> {
  const tracked = request.finally(() => {
    if (inFlightRequests.get(key) === tracked) inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, tracked);
  return tracked;
}

/** Preenche o cache em segundo plano sem propagar falhas ao chamador. */
export async function prewarmAsyncDataCache<T>(key: string, loader: () => Promise<T>): Promise<void> {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.at < CACHE_TTL_PADRAO_MS) return;
  // Uma resposta null também é dado carregado; a presença da chave é o que conta.
  if (inFlightRequests.has(key)) return;

  const version = cacheClearVersion;
  try {
    const data = await trackInFlightRequest(key, loader());
    if (version === cacheClearVersion) cache.set(key, { data, at: Date.now() });
  } catch {
    // Falhas de pré-aquecimento não devem afetar a interface.
  }
}

/** Marca entradas como obsoletas sem remover os dados visíveis. */
export function invalidateAsyncDataCache(prefix?: string): void {
  for (const [key, entry] of cache) {
    if (prefix === undefined || key.startsWith(prefix)) entry.at = 0;
  }
}

/** Remove todas as entradas, por exemplo ao encerrar a sessão do usuário. */
export function clearAsyncDataCache(): void {
  cacheClearVersion += 1;
  cache.clear();
  inFlightRequests.clear();
  cacheClearListeners.forEach((listener) => listener());
}

function defaultIsEmpty<T>(data: T): boolean {
  return Array.isArray(data) && data.length === 0;
}

function getCachedData<T>(key?: string): T | null {
  if (!key) return null;
  return (cache.get(key)?.data as T | undefined) ?? null;
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

  const [dataState, setDataState] = useState(() => ({ key: cacheKey, data: getCachedData<T>(cacheKey) }));
  const [requestState, setRequestState] = useState<RequestState>(() => ({
    key: cacheKey,
    // null é uma resposta legítima: só a ausência da entrada significa que falta carregar.
    loading: enabled && (!cacheKey || !cache.has(cacheKey)),
    error: null,
  }));
  const [reloadToken, setReloadToken] = useState(0);

  const loaderRef = useRef(loader);
  const isEmptyRef = useRef(isEmptyCheck);
  const requestIdRef = useRef(0);
  const forceRefreshRef = useRef(false);

  useEffect(() => {
    loaderRef.current = loader;
    isEmptyRef.current = isEmptyCheck;
  });

  useEffect(() => {
    const clearLocalData = () => {
      requestIdRef.current += 1;
      forceRefreshRef.current = true;
      setDataState({ key: cacheKey, data: null });
      setRequestState({ key: cacheKey, loading: enabled, error: null });
      setReloadToken((token) => token + 1);
    };
    cacheClearListeners.add(clearLocalData);
    return () => {
      cacheClearListeners.delete(clearLocalData);
    };
  }, [cacheKey, enabled]);

  const data = dataState.key === cacheKey ? dataState.data : getCachedData<T>(cacheKey);

  useEffect(() => {
    if (!enabled) {
      setRequestState({ key: cacheKey, loading: false, error: null });
      return;
    }

    const forceRefresh = forceRefreshRef.current;
    forceRefreshRef.current = false;
    const entry = cacheKey ? cache.get(cacheKey) : undefined;
    // null é resposta legítima; uma entrada existente continua visível durante a revalidação.
    const hasVisibleData = cacheKey
      ? cache.has(cacheKey)
      : dataState.key === cacheKey && dataState.data !== null;

    if (entry && !forceRefresh && Date.now() - entry.at < cacheTtlMs) {
      setDataState({ key: cacheKey, data: entry.data as T });
      setRequestState({ key: cacheKey, loading: false, error: null });
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setRequestState({ key: cacheKey, loading: !hasVisibleData, error: null });

    const existingRequest = cacheKey ? inFlightRequests.get(cacheKey) as Promise<T> | undefined : undefined;
    const request = existingRequest ?? (cacheKey
      ? trackInFlightRequest(cacheKey, withTimeout(loaderRef.current(), timeoutMs))
      : withTimeout(loaderRef.current(), timeoutMs));

    withTimeout(request, timeoutMs)
      .then((result) => {
        if (requestId !== requestIdRef.current) return;
        if (cacheKey) cache.set(cacheKey, { data: result, at: Date.now() });
        setDataState({ key: cacheKey, data: result });
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setRequestState({
          key: cacheKey,
          loading: false,
          error: err instanceof Error ? err.message : 'Não foi possível carregar os dados.',
        });
      })
      .finally(() => {
        if (requestId !== requestIdRef.current) return;
        setRequestState((current) => current.key === cacheKey ? { ...current, loading: false } : current);
      });

    return () => {
      if (requestId === requestIdRef.current) {
        requestIdRef.current = requestId + 1;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, timeoutMs, reloadToken, cacheKey, cacheTtlMs, ...deps]);

  const reload = useCallback(() => {
    forceRefreshRef.current = true;
    setReloadToken((token) => token + 1);
  }, []);

  const isLoading = enabled && data === null && (requestState.key !== cacheKey || requestState.loading);
  const error = data === null && requestState.key === cacheKey ? requestState.error : null;
  const isEmpty = data !== null && (isEmptyRef.current ? isEmptyRef.current(data) : defaultIsEmpty(data));

  return { data, isLoading, error, isEmpty, reload };
}

export default useAsyncData;
