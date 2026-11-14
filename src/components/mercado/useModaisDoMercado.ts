import { useCallback, useState } from 'react';
import { mercadoService } from '../../services/mercadoService';
import type { MercadoItem } from '../../types';

interface UseModaisDoMercadoOptions {
  /** Descarta o cache do catálogo após uma escrita do Administrador. */
  onCatalogoAlterado: () => Promise<unknown>;
}

/**
 * Estado de interação da tela: as três telas sobrepostas (detalhes/compra,
 * criar/editar mercadoria e seleção de comprador) e as escritas do
 * Administrador que passam pelo modal de mercadoria.
 */
export function useModaisDoMercado({ onCatalogoAlterado }: UseModaisDoMercadoOptions) {
  // Modal 3.1: Detalhes e Compra
  const [selectedItem, setSelectedItem] = useState<MercadoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Modal 3.2: Criar/Editar Mercadoria (Acesso exclusivo Administrador)
  const [isModalCriarOpen, setIsModalCriarOpen] = useState<boolean>(false);
  const [itemParaEdicao, setItemParaEdicao] = useState<MercadoItem | null>(null);

  // Modal 3.3: Seleção do comprador da comitiva
  const [isModalCompradorOpen, setIsModalCompradorOpen] = useState<boolean>(false);

  // Abertura do Modal 3.1
  const abrirDetalhes = useCallback((item: MercadoItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  }, []);

  const fecharDetalhes = useCallback(() => setIsModalOpen(false), []);

  // Abertura do Modal de Criação pelo Administrador
  const abrirCriacao = useCallback(() => {
    setItemParaEdicao(null);
    setIsModalCriarOpen(true);
  }, []);

  // Abertura do Modal de Edição pelo Administrador
  const abrirEdicao = useCallback((item: MercadoItem) => {
    setItemParaEdicao(item);
    setIsModalOpen(false);
    setIsModalCriarOpen(true);
  }, []);

  // Retorno da edição para a visualização dos detalhes do item
  const voltarParaDetalhes = useCallback(() => {
    setIsModalCriarOpen(false);
    setItemParaEdicao(null);
    setIsModalOpen(true);
  }, []);

  const fecharCriacao = useCallback(() => {
    setIsModalCriarOpen(false);
    setItemParaEdicao(null);
  }, []);

  const abrirSelecaoComprador = useCallback(() => setIsModalCompradorOpen(true), []);
  const fecharSelecaoComprador = useCallback(() => setIsModalCompradorOpen(false), []);

  // Exclusão de mercadoria pelo Administrador
  const excluirMercadoria = async (item: MercadoItem) => {
    await mercadoService.excluirMercadoria(item.id);
    await onCatalogoAlterado();
  };

  // Cadastro ou Atualização de mercadoria pelo Administrador
  const salvarMercadoria = async (itemSalvo: MercadoItem) => {
    if (itemParaEdicao) {
      await mercadoService.atualizarMercadoria(itemSalvo);
    } else {
      await mercadoService.criarMercadoria(itemSalvo);
    }
    setItemParaEdicao(null);
    await onCatalogoAlterado();
  };

  return {
    selectedItem,
    isModalOpen,
    isModalCriarOpen,
    itemParaEdicao,
    isModalCompradorOpen,
    abrirDetalhes,
    fecharDetalhes,
    abrirCriacao,
    abrirEdicao,
    voltarParaDetalhes,
    fecharCriacao,
    abrirSelecaoComprador,
    fecharSelecaoComprador,
    excluirMercadoria,
    salvarMercadoria,
  };
}
