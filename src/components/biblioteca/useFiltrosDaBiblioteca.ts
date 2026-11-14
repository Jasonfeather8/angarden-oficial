import { useCallback, useEffect, useState } from 'react';
import { normalizarBusca, TAMANHO_MINIMO_BUSCA } from '@/utils/normalizarBusca';

/** Espera antes de consultar o servidor, para não disparar a cada tecla. */
const ESPERA_BUSCA_MS = 300;

/**
 * Filtros da estante: termo de busca (com espera) e categoria escolhida. A busca
 * só vai ao servidor depois da espera e a partir do tamanho mínimo — abaixo
 * disso o índice de trigrama não ajuda.
 */
export function useFiltrosDaBiblioteca() {
  const [termo, setTermo] = useState('');
  const [termoDebounced, setTermoDebounced] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);

  useEffect(() => {
    const temporizador = setTimeout(() => setTermoDebounced(termo), ESPERA_BUSCA_MS);
    return () => clearTimeout(temporizador);
  }, [termo]);

  const termoNormalizado = normalizarBusca(termoDebounced);
  const filtroAtivo = categoriaFiltro !== null || termoNormalizado.length >= TAMANHO_MINIMO_BUSCA;

  const limparTermo = useCallback(() => setTermo(''), []);

  const limparFiltros = useCallback(() => {
    setTermo('');
    setCategoriaFiltro(null);
  }, []);

  return {
    termo,
    setTermo,
    categoriaFiltro,
    setCategoriaFiltro,
    termoNormalizado,
    filtroAtivo,
    limparTermo,
    limparFiltros,
  };
}
