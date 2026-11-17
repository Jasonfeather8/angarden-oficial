import React, { Suspense } from 'react';
import type { MercadoItem } from '@/types';
import { ModalDetalhesCompraLazy } from './modalDetalhesCompraLazy';
import { useCompradorDoMercado } from './useCompradorDoMercado';

export interface DetalhesDaMercadoriaModalProps {
  item: MercadoItem;
  onClose: () => void;
}

/**
 * Detalhe da mercadoria do Mercado aberto fora da tela do Mercado (na crônica,
 * por exemplo): o mesmo modal e o mesmo domínio do comprador, para saldo,
 * permissões e compra se comportarem igual.
 */
export const DetalhesDaMercadoriaModal: React.FC<DetalhesDaMercadoriaModalProps> = ({ item, onClose }) => {
  const comprador = useCompradorDoMercado();
  return (
    <Suspense fallback={null}>
      <ModalDetalhesCompraLazy
        isOpen
        onClose={onClose}
        item={item}
        saldoAtual={comprador.saldoAtual}
        cargaAtual={comprador.cargaAtual}
        nomePersonagemComprador={comprador.fichaDoComprador?.identidade?.nome_personagem}
        temPermissaoEpica={comprador.temPermissaoEpica}
        temPermissaoArcano={comprador.temPermissaoArcano}
        temPermissaoCompra={comprador.temPermissaoCompra}
        onConfirmarCompra={comprador.confirmarCompra}
      />
    </Suspense>
  );
};

export default DetalhesDaMercadoriaModal;
