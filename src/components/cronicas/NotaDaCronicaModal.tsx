import React, { useEffect, useState } from 'react';
import type { NotaDaCronica } from '@/types';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';

const inputClassName =
  'mt-1 w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2 text-sm text-[#e6ddc5] outline-none focus:border-[#b89558]';

export interface NotaDaCronicaModalProps {
  isOpen: boolean;
  /** Nota em edição; ausente quando é uma nota nova. */
  nota?: NotaDaCronica;
  onClose: () => void;
  onSave: (dados: Omit<NotaDaCronica, 'id' | 'criadaEm' | 'autorId'>) => Promise<void>;
}

/** Registro de uma nota do Mestre, com a visibilidade por nota. */
export const NotaDaCronicaModal: React.FC<NotaDaCronicaModalProps> = ({ isOpen, nota, onClose, onSave }) => {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [visivelJogadores, setVisivelJogadores] = useState(false);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setTitulo(nota?.titulo ?? '');
    setConteudo(nota?.conteudo ?? '');
    setVisivelJogadores(nota?.visivelJogadores ?? false);
    setErro('');
  }, [nota, isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSalvando(true);
    setErro('');
    try {
      await onSave({ titulo: titulo.trim(), conteudo: conteudo.trim(), visivelJogadores });
      onClose();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível salvar a nota.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={nota ? 'Editar nota' : 'Nova nota'}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
          Título
          <input
            required
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            className={inputClassName}
          />
        </label>
        <label className="block font-cinzel text-[10px] uppercase tracking-wider text-[#c9aa68]">
          Conteúdo
          <textarea
            required
            rows={7}
            value={conteudo}
            onChange={(event) => setConteudo(event.target.value)}
            className={`${inputClassName} resize-y font-serif`}
          />
        </label>
        <label className="flex items-center gap-2 font-serif text-sm text-[#c6a66d]">
          <input
            type="checkbox"
            checked={visivelJogadores}
            onChange={(event) => setVisivelJogadores(event.target.checked)}
            className="accent-[#b89558]"
          />
          Visível para os jogadores
        </label>
        {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
        <div className="flex justify-end border-t border-[#3a2c1d] pt-4">
          <GothicButton type="submit" size="sm" width={170} height={38} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar nota'}
          </GothicButton>
        </div>
      </form>
    </Modal>
  );
};

export default NotaDaCronicaModal;
