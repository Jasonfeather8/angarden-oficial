import { useState } from 'react';

interface UseModaisDaMesaOptions {
  /** Descarta os caches afetados e recarrega a mesa depois de gravar. */
  onAtualizarMesa: () => void;
  onStatus: (mensagem: string) => void;
}

/**
 * Modais auxiliares do painel (Grimório, Limites e Distribuir tesouro). Abrir
 * qualquer um limpa o aviso da tela, e concluir a distribuição recarrega a mesa
 * com a mensagem que o próprio modal devolve.
 */
export function useModaisDaMesa({ onAtualizarMesa, onStatus }: UseModaisDaMesaOptions) {
  const [isGrimorioOpen, setIsGrimorioOpen] = useState(false);
  const [isLimitesOpen, setIsLimitesOpen] = useState(false);
  const [isDistribuirOpen, setIsDistribuirOpen] = useState(false);

  const abrirGrimorio = () => {
    onStatus('');
    setIsGrimorioOpen(true);
  };

  const abrirLimites = () => {
    onStatus('');
    setIsLimitesOpen(true);
  };

  const abrirDistribuir = () => {
    onStatus('');
    setIsDistribuirOpen(true);
  };

  const concluirDistribuicao = (mensagem: string) => {
    onAtualizarMesa();
    onStatus(mensagem);
  };

  return {
    isGrimorioOpen,
    abrirGrimorio,
    fecharGrimorio: () => setIsGrimorioOpen(false),
    isLimitesOpen,
    abrirLimites,
    fecharLimites: () => setIsLimitesOpen(false),
    isDistribuirOpen,
    abrirDistribuir,
    fecharDistribuir: () => setIsDistribuirOpen(false),
    concluirDistribuicao,
  };
}
