/**
 * Executa uma tarefa de fundo quando o navegador estiver ocioso, sem competir
 * com o render inicial nem com as requisições da tela atual.
 * Devolve a função de cancelamento (use no retorno do efeito).
 */
export function agendarEmOciosidade(callback: () => void, timeoutMs = 2000): () => void {
  let cancelled = false;
  let idleHandle: number | undefined;
  let timerHandle: number | undefined;
  const browserWindow = window as Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    cancelIdleCallback?: (handle: number) => void;
  };

  const run = () => {
    if (!cancelled) callback();
  };

  if (browserWindow.requestIdleCallback) {
    idleHandle = browserWindow.requestIdleCallback(run, { timeout: timeoutMs });
  } else {
    timerHandle = window.setTimeout(run, timeoutMs);
  }

  return () => {
    cancelled = true;
    if (idleHandle !== undefined) browserWindow.cancelIdleCallback?.(idleHandle);
    if (timerHandle !== undefined) window.clearTimeout(timerHandle);
  };
}
