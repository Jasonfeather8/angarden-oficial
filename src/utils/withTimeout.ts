export const DEFAULT_TIMEOUT_MS = 15000;

export class TimeoutError extends Error {
  constructor(message = 'O tempo de resposta foi excedido. Tente novamente.') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Envolve uma promise com um limite de tempo, evitando que a interface fique
 * presa em estado de carregamento indefinidamente quando a rede falha.
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
  message?: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}
