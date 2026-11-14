import React, { useState } from 'react';
import { cronicaService } from '@/services/cronicaService';
import type { ParticipanteDaCronica } from '@/types';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';

export interface EntregarRecompensaModalProps {
  isOpen: boolean;
  rewardId: string;
  participantes: ParticipanteDaCronica[];
  /** Personagens que já receberam esta recompensa. */
  entreguesA: string[];
  onClose: () => void;
  onDone: () => void;
}

/** Entrega da recompensa aos personagens aprovados escolhidos pelo Mestre. */
export const EntregarRecompensaModal: React.FC<EntregarRecompensaModalProps> = ({
  isOpen,
  rewardId,
  participantes,
  entreguesA,
  onClose,
  onDone,
}) => {
  const elegiveis = participantes.filter(
    (participante) => participante.status === 'aprovado' && !entreguesA.includes(participante.characterId),
  );
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [entregues, setEntregues] = useState<number | null>(null);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const entregar = async () => {
    setEnviando(true);
    setErro('');
    try {
      const total = await cronicaService.entregarRecompensa(rewardId, selecionados);
      setEntregues(total);
      onDone();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível entregar a recompensa.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Entregar recompensa" subtitle="Escolha quem recebe">
      {entregues === null ? (
        <div className="space-y-3">
          {elegiveis.length === 0 ? (
            <p className="font-serif text-sm italic text-[#8f795e]">
              Nenhum personagem aprovado aguarda esta recompensa.
            </p>
          ) : (
            <ul className="space-y-2">
              {elegiveis.map((participante) => (
                <li key={participante.characterId}>
                  <label className="flex items-center gap-2 font-serif text-sm text-[#d6c4ae]">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(participante.characterId)}
                      onChange={(event) =>
                        setSelecionados((atuais) =>
                          event.target.checked
                            ? [...atuais, participante.characterId]
                            : atuais.filter((id) => id !== participante.characterId),
                        )
                      }
                      className="accent-[#b89558]"
                    />
                    {participante.nomePersonagem}
                    <span className="text-xs text-[#8f795e]">({participante.nomeJogador})</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
          <div className="flex justify-end border-t border-[#3a2c1d] pt-4">
            <GothicButton
              size="sm"
              width={200}
              height={38}
              disabled={selecionados.length === 0 || enviando}
              onClick={() => void entregar()}
            >
              {enviando ? 'Entregando…' : 'Entregar recompensa'}
            </GothicButton>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-serif text-sm text-[#d6c4ae]">
            {entregues} {entregues === 1 ? 'personagem recebeu' : 'personagens receberam'} a recompensa.
          </p>
          <div className="flex justify-end">
            <GothicButton size="sm" width={140} height={38} onClick={onClose}>Fechar</GothicButton>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default EntregarRecompensaModal;
