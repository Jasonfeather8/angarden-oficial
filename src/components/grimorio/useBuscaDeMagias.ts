import { useEffect, useState } from 'react';
import { normalizarBusca, TAMANHO_MINIMO_BUSCA } from '../../utils/normalizarBusca';

interface UseBuscaDeMagiasOptions {
  /** Volta o livro ao primeiro fólio a cada alteração da busca. */
  onResetPagina: () => void;
}

/**
 * Busca textual em todos os volumes, com o mesmo atraso de digitação e a
 * normalização aplicada pelo índice do servidor.
 */
export function useBuscaDeMagias({ onResetPagina }: UseBuscaDeMagiasOptions) {
  const [busca, setBusca] = useState('');
  const [buscaDebounced, setBuscaDebounced] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => setBuscaDebounced(normalizarBusca(busca)), 300);
    return () => window.clearTimeout(timeout);
  }, [busca]);

  const termoBusca = normalizarBusca(buscaDebounced);
  const buscandoMagias = termoBusca.length >= TAMANHO_MINIMO_BUSCA;

  const atualizarBusca = (valor: string) => {
    setBusca(valor);
    onResetPagina();
  };

  const limparBusca = () => {
    setBusca('');
    onResetPagina();
  };

  return { busca, termoBusca, buscandoMagias, atualizarBusca, limparBusca };
}
