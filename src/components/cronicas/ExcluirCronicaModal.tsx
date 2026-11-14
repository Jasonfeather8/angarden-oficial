import React, { useState } from 'react';
import { cronicaService } from '@/services/cronicaService';
import type { Cronica } from '@/types';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';

export interface ExcluirCronicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronica: Cronica;
  /** Recarrega a lista de crônicas depois da exclusão. */
  onExcluida: () => void;
}

/** Confirmação da exclusão da crônica (só o Mestre autor chega aqui). */
export const ExcluirCronicaModal: React.FC<ExcluirCronicaModalProps> = ({
  isOpen,
  onClose,
  cronica,
  onExcluida,
}) => {
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState('');

  const excluir = async () => {
    setExcluindo(true);
    setErro('');
    try {
      await cronicaService.excluir(cronica.id);
      onExcluida();
      onClose();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível excluir a crônica.');
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Excluir crônica" subtitle="Esta ação não pode ser desfeita">
      <p className="font-serif text-sm text-[#d6c4ae]">
        Deseja excluir <strong className="text-[#f0d79b]">{cronica.titulo}</strong>? Os objetivos, as notas, as
        recompensas e as inscrições desta crônica também serão removidos.
      </p>
      <p className="border border-[#5a4225] bg-[#1b120b] px-3 py-2 font-serif text-xs text-[#c6a66d]">
        O que já foi entregue permanece na ficha dos personagens — a exclusão apaga apenas o registro da crônica.
      </p>
      {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
      <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#3a2c1d] pt-4 sm:flex-row">
        <button
          type="button"
          onClick={onClose}
          disabled={excluindo}
          className="border border-[#4b3823] bg-[#120d09] px-4 py-2 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]"
        >
          Cancelar
        </button>
        <GothicButton variant="danger" size="sm" width={190} height={38} disabled={excluindo} onClick={() => void excluir()}>
          {excluindo ? 'Excluindo…' : 'Excluir crônica'}
        </GothicButton>
      </div>
    </Modal>
  );
};

export default ExcluirCronicaModal;
