import { useState } from 'react';
import type { FormEvent } from 'react';
import { fichaService } from '@/services/fichaService';
import type { CharacterRow } from './useMesaDoMestre';

export type OperacaoDeTesouro = 'add' | 'remove';

interface UseTesouroFormOptions {
  characters: CharacterRow[];
  /** Descarta os caches afetados e recarrega a mesa depois de gravar. */
  onAtualizarMesa: () => void;
  onStatus: (mensagem: string) => void;
}

/** Ajuste pontual de tesouro de uma ficha: adicionar ou remover uma quantia. */
export function useTesouroForm({ characters, onAtualizarMesa, onStatus }: UseTesouroFormOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [personagemId, setPersonagemId] = useState('');
  const [quantia, setQuantia] = useState('');
  const [operacao, setOperacao] = useState<OperacaoDeTesouro>('add');
  const [erro, setErro] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const abrir = (characterId?: string) => {
    setPersonagemId(characterId || characters[0]?.id || '');
    setQuantia('');
    setOperacao('add');
    setErro('');
    setIsOpen(true);
  };

  const fechar = () => {
    if (isSaving) return;
    setIsOpen(false);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = Number(quantia.replace(',', '.'));
    const character = characters.find((item) => item.id === personagemId);

    if (!character) {
      setErro('Selecione um personagem.');
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setErro('Informe uma quantia maior que zero.');
      return;
    }

    setIsSaving(true);
    setErro('');
    try {
      const ficha = await fichaService.ensureFicha(character.id);
      const currentMoney = Math.max(0, Number(ficha.recursos.dinheiro) || 0);
      if (operacao === 'remove' && amount > currentMoney) {
        setErro('A remoção não pode deixar o tesouro negativo.');
        return;
      }

      await fichaService.adjustTreasure(character.id, operacao === 'add' ? amount : -amount);

      onAtualizarMesa();
      setIsOpen(false);
      onStatus(`Tesouro de ${character.nome} atualizado.`);
      setQuantia('');
    } catch {
      setErro('Não foi possível salvar o ajuste de tesouro.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isOpen,
    abrir,
    fechar,
    personagemId,
    setPersonagemId,
    quantia,
    setQuantia,
    operacao,
    setOperacao,
    erro,
    isSaving,
    submit,
  };
}
