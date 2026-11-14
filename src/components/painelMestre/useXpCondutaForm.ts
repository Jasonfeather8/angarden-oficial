import { useState } from 'react';
import type { FormEvent } from 'react';
import { fichaService } from '@/services/fichaService';
import type { CharacterRow } from './useMesaDoMestre';

interface UseXpCondutaFormOptions {
  characters: CharacterRow[];
  /** Descarta os caches afetados e recarrega a mesa depois de gravar. */
  onAtualizarMesa: () => void;
  onStatus: (mensagem: string) => void;
}

/**
 * Concessão de XP de conduta: o destinatário (toda a mesa ou uma ficha), a
 * quantidade, o motivo e o envio ao serviço.
 */
export function useXpCondutaForm({ characters, onAtualizarMesa, onStatus }: UseXpCondutaFormOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [destinatario, setDestinatario] = useState('all');
  const [quantidade, setQuantidade] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const abrir = () => {
    setDestinatario('all');
    setQuantidade('');
    setMotivo('');
    setErro('');
    setIsOpen(true);
  };

  const fechar = () => {
    if (isSaving) return;
    setIsOpen(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(quantidade.replace(',', '.'));
    const reason = motivo.trim();
    const targetIds = destinatario === 'all' ? characters.map((character) => character.id) : [destinatario];

    if (!Number.isFinite(amount) || amount <= 0) {
      setErro('Informe uma quantidade de XP maior que zero.');
      return;
    }
    if (!reason) {
      setErro('Informe o motivo da concessão.');
      return;
    }
    if (targetIds.length === 0) {
      setErro('Não há fichas disponíveis para receber XP.');
      return;
    }

    setIsSaving(true);
    setErro('');
    try {
      await Promise.all(targetIds.map((characterId) => fichaService.ensureFicha(characterId)));
      await Promise.all(targetIds.map((characterId) => fichaService.grantXp(characterId, amount, reason)));

      onAtualizarMesa();
      setIsOpen(false);
      onStatus(`XP concedido com sucesso. Motivo: ${reason}`);
      setQuantidade('');
      setMotivo('');
    } catch {
      setErro('Não foi possível salvar a concessão de XP.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isOpen,
    abrir,
    fechar,
    destinatario,
    setDestinatario,
    quantidade,
    setQuantidade,
    motivo,
    setMotivo,
    erro,
    isSaving,
    submit,
  };
}
