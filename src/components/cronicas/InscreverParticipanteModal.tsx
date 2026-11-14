import React, { useEffect, useState } from 'react';
import { cronicaService } from '@/services/cronicaService';
import { fichaService } from '@/services/fichaService';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';
import { LoadingState } from '../ui/Skeleton';

export interface InscreverParticipanteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cronicaId: string;
  /** Personagens que já constam na crônica. */
  inscritos: string[];
  onDone: () => void;
}

/** O Mestre autor inscreve um personagem do acervo direto na crônica. */
export const InscreverParticipanteModal: React.FC<InscreverParticipanteModalProps> = ({
  isOpen,
  onClose,
  cronicaId,
  inscritos,
  onDone,
}) => {
  const [personagens, setPersonagens] = useState<Array<{ id: string; nome: string }>>([]);
  const [selecionado, setSelecionado] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let ativo = true;
    setCarregando(true);
    setErro('');
    setSelecionado('');
    void fichaService
      .getListaPersonagens()
      .then((lista) => {
        if (ativo) setPersonagens(lista.map((personagem) => ({ id: personagem.id, nome: personagem.nome })));
      })
      .catch((cause: unknown) => {
        if (ativo) setErro(cause instanceof Error ? cause.message : 'Não foi possível carregar os personagens.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [isOpen]);

  const disponiveis = personagens.filter((personagem) => !inscritos.includes(personagem.id));

  const inscrever = async () => {
    if (!selecionado) return;
    setEnviando(true);
    setErro('');
    try {
      await cronicaService.inscreverParticipante(cronicaId, selecionado, 'aprovado');
      onDone();
      onClose();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível inscrever o personagem.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Inscrever personagem" subtitle="A inscrição entra já aprovada">
      {carregando ? (
        <LoadingState variant="text" label="Carregando personagens…" />
      ) : disponiveis.length === 0 ? (
        <p className="font-serif text-sm italic text-[#8f795e]">Todos os personagens já estão inscritos.</p>
      ) : (
        <ul className="space-y-2">
          {disponiveis.map((personagem) => (
            <li key={personagem.id}>
              <label className="flex items-center gap-2 font-serif text-sm text-[#d6c4ae]">
                <input
                  type="radio"
                  name="personagem-da-cronica"
                  checked={selecionado === personagem.id}
                  onChange={() => setSelecionado(personagem.id)}
                  className="accent-[#b89558]"
                />
                {personagem.nome}
              </label>
            </li>
          ))}
        </ul>
      )}
      {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
      <div className="flex justify-end border-t border-[#3a2c1d] pt-4">
        <GothicButton size="sm" width={190} height={38} disabled={!selecionado || enviando} onClick={() => void inscrever()}>
          {enviando ? 'Inscrevendo…' : 'Inscrever personagem'}
        </GothicButton>
      </div>
    </Modal>
  );
};

export default InscreverParticipanteModal;
