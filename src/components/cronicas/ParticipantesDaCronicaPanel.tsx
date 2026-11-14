import React, { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { cronicaService } from '@/services/cronicaService';
import type { Cronica, SituacaoParticipante } from '@/types';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { LoadingState } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { CompartilharCronicaModal } from './CompartilharCronicaModal';
import { InscreverParticipanteModal } from './InscreverParticipanteModal';
import { useParticipantesDaCronica } from './useParticipantesDaCronica';

const ROTULO_DA_SITUACAO: Record<SituacaoParticipante, string> = {
  pendente: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
};

export interface ParticipantesDaCronicaPanelProps {
  cronica: Cronica;
  podeGerir: boolean;
  userId: string | null;
  onAlterados: () => void;
}

/** Companhia da crônica: inscrições por convite, aprovadas pelo Mestre autor. */
export const ParticipantesDaCronicaPanel: React.FC<ParticipantesDaCronicaPanelProps> = ({
  cronica,
  podeGerir,
  userId,
  onAlterados,
}) => {
  const { participantes, isLoading, error, reload } = useParticipantesDaCronica(cronica.id);
  const [inscrevendo, setInscrevendo] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const [erro, setErro] = useState('');

  const visiveis = podeGerir ? participantes : participantes.filter((participante) => participante.userId === userId);

  const executar = async (acao: () => Promise<unknown>) => {
    setErro('');
    try {
      await acao();
      reload();
      onAlterados();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível atualizar a companhia.');
    }
  };

  const recarregar = () => {
    reload();
    onAlterados();
  };

  return (
    <>
      <PainelSecao
        title="Companhia da crônica"
        icon={<Users className="h-4 w-4" />}
        extra={
          podeGerir ? (
            <div className="flex flex-wrap gap-2">
              <ToolbarButton icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setInscrevendo(true)}>
                Inscrever personagem
              </ToolbarButton>
              <ToolbarButton onClick={() => setCompartilhando(true)}>Compartilhar convite</ToolbarButton>
            </div>
          ) : null
        }
      >
        {isLoading ? (
          <LoadingState variant="text" label="Carregando participantes…" />
        ) : error ? (
          <ErrorState description={error} onRetry={recarregar} />
        ) : visiveis.length === 0 ? (
          <p className="font-serif text-sm italic text-[#8f795e]">Nenhum personagem inscrito nesta crônica.</p>
        ) : (
          <ul className="space-y-2">
            {visiveis.map((participante) => (
              <li
                key={participante.id}
                className="flex flex-wrap items-center gap-2 border border-[#3a2c1d] bg-[#120d09] p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-cinzel text-sm font-bold text-[#e0bd71]">{participante.nomePersonagem}</p>
                  <p className="font-serif text-xs text-[#8f795e]">{participante.nomeJogador}</p>
                </div>
                <span className="border border-[#5a4225] bg-[#1b120b] px-2 py-1 font-serif text-[11px] text-[#c6a66d]">
                  {ROTULO_DA_SITUACAO[participante.status]}
                </span>
                {podeGerir && (
                  <div className="flex flex-wrap gap-2">
                    {participante.status !== 'aprovado' && (
                      <ToolbarButton
                        onClick={() => void executar(() => cronicaService.aprovarParticipante(participante.id))}
                      >
                        Aprovar
                      </ToolbarButton>
                    )}
                    {participante.status !== 'recusado' && (
                      <ToolbarButton
                        onClick={() => void executar(() => cronicaService.recusarParticipante(participante.id))}
                      >
                        Recusar
                      </ToolbarButton>
                    )}
                    <ToolbarButton onClick={() => void executar(() => cronicaService.removerParticipante(participante.id))}>
                      Remover
                    </ToolbarButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {erro && <p role="alert" className="mt-3 font-serif text-sm text-red-300">{erro}</p>}
      </PainelSecao>

      <InscreverParticipanteModal
        isOpen={inscrevendo}
        onClose={() => setInscrevendo(false)}
        cronicaId={cronica.id}
        inscritos={participantes.map((participante) => participante.characterId)}
        onDone={recarregar}
      />

      <CompartilharCronicaModal
        isOpen={compartilhando}
        onClose={() => setCompartilhando(false)}
        cronicaId={cronica.id}
      />
    </>
  );
};

export default ParticipantesDaCronicaPanel;
