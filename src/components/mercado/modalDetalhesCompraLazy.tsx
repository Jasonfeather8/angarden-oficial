import React from 'react';

/**
 * Tela 3.1 (Detalhes e Compra) carregada sob demanda, com pré-carregamento
 * disparado na ociosidade e ao passar o mouse sobre uma linha de item.
 */
export const ModalDetalhesCompraLazy = React.lazy(() =>
  import('../ModalDetalhesCompra').then((m) => ({ default: m.ModalDetalhesCompra }))
);

export const preloadModalDetalhesCompra = () => {
  void import('../ModalDetalhesCompra');
};
