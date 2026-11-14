import React, { useEffect, useMemo, useState } from 'react';
import { Gift, HandCoins, Package } from 'lucide-react';
import { cronicaService } from '@/services/cronicaService';
import { fichaService } from '@/services/fichaService';
import { useAuthorization } from '@/hooks/useAuthorization';
import type { Cronica, NovaRecompensaCronica, RecompensaDaCronica } from '@/types';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { LoadingState } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { EntregarRecompensaModal } from './EntregarRecompensaModal';
import { RecompensaDaCronicaModal } from './RecompensaDaCronicaModal';
import { SeletorDeLootModal } from './SeletorDeLootModal';
import { useObjetivosDaCronica } from './useObjetivosDaCronica';
import { useParticipantesDaCronica } from './useParticipantesDaCronica';
import { useRecompensasDaCronica } from './useRecompensasDaCronica';

export interface RecompensasDaCronicaPanelProps {
  cronica: Cronica;
  podeGerir: boolean;
  somenteLeitura?: boolean;
  onCronicaAlterada?: () => void;
}

function descreverValor(recompensa: RecompensaDaCronica): string {
  if (recompensa.tipo === 'item') {
    return `${recompensa.itemNome ?? recompensa.itemId ?? 'Mercadoria'} × ${recompensa.quantidade}`;
  }
  if (recompensa.tipo === 'dinheiro') return `${recompensa.valor} moedas`;
  if (recompensa.tipo === 'xp') return `${recompensa.valor} XP`;
  return recompensa.spellNome ?? recompensa.spellId ?? 'Magia';
}

/**
 * Recompensas por objetivo e na conclusão da crônica, mais as mercadorias
 * vinculadas. O Mestre autor entrega aos personagens aprovados; o jogador
 * resgata para os próprios personagens quando a recompensa é liberada.
 */
export const RecompensasDaCronicaPanel: React.FC<RecompensasDaCronicaPanelProps> = ({ cronica, podeGerir, somenteLeitura = false, onCronicaAlterada }) => {
  // Na tela da crônica o painel é leitura; o Mestre gere as recompensas no modal.
  const podeEditar = podeGerir && !somenteLeitura;
  const { userId } = useAuthorization();
  const { recompensas, isLoading, error, reload } = useRecompensasDaCronica(cronica.id);
  const objetivos = useObjetivosDaCronica(cronica.id);
  const participantes = useParticipantesDaCronica(cronica.id);
  const recarregar = () => {
    reload();
    onCronicaAlterada?.();
  };

  const [formularioAberto, setFormularioAberto] = useState(false);
  const [editando, setEditando] = useState<RecompensaDaCronica | undefined>(undefined);
  const [entregando, setEntregando] = useState<RecompensaDaCronica | undefined>(undefined);
  const [selecionandoLoot, setSelecionandoLoot] = useState(false);
  const [meusPersonagens, setMeusPersonagens] = useState<Array<{ id: string; nome: string }>>([]);
  const [erro, setErro] = useState('');

  // Só quem pode resgatar precisa saber quais personagens são seus.
  useEffect(() => {
    if (podeGerir) return;
    let ativo = true;
    void fichaService
      .getListaPersonagens()
      .then((personagens) => {
        if (ativo) setMeusPersonagens(personagens.map((personagem) => ({ id: personagem.id, nome: personagem.nome })));
      })
      .catch(() => {
        if (ativo) setMeusPersonagens([]);
      });
    return () => {
      ativo = false;
    };
  }, [podeGerir]);

  const aprovadosPorPersonagem = useMemo(
    () =>
      new Map(
        participantes.participantes
          .filter((participante) => participante.status === 'aprovado')
          .map((participante) => [participante.characterId, participante]),
      ),
    [participantes.participantes],
  );

  const salvar = async (dados: NovaRecompensaCronica) => {
    if (editando) await cronicaService.atualizarRecompensa(editando.id, dados);
    else await cronicaService.criarRecompensa(cronica.id, dados);
    recarregar();
  };

  const excluir = async (recompensa: RecompensaDaCronica) => {
    setErro('');
    try {
      await cronicaService.excluirRecompensa(recompensa.id);
      recarregar();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível excluir a recompensa.');
    }
  };

  const resgatar = async (recompensa: RecompensaDaCronica, characterId: string) => {
    setErro('');
    try {
      await cronicaService.resgatarRecompensa(recompensa.id, characterId);
      recarregar();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível resgatar a recompensa.');
    }
  };

  const liberada = (recompensa: RecompensaDaCronica): boolean => {
    if (recompensa.objetivoId) {
      return objetivos.objetivos.find((objetivo) => objetivo.id === recompensa.objetivoId)?.concluido === true;
    }
    return cronica.status === 'CONCLUIDA';
  };

  const renderizarRecompensa = (recompensa: RecompensaDaCronica) => {
    const meusElegiveis = meusPersonagens.filter(
      (personagem) =>
        aprovadosPorPersonagem.get(personagem.id)?.userId === userId &&
        !recompensa.entreguesA.includes(personagem.id),
    );
    const recebedores = recompensa.entreguesA.map(
      (characterId) => aprovadosPorPersonagem.get(characterId)?.nomePersonagem ?? characterId,
    );

    return (
      <li key={recompensa.id} className="border border-[#3a2c1d] bg-[#120d09] p-3">
        <div className="flex flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1">
            <p className="font-cinzel text-sm font-bold text-[#e0bd71]">{descreverValor(recompensa)}</p>
            {recompensa.descricao && (
              <p className="mt-1 font-serif text-sm text-[#c4b9a3]">{recompensa.descricao}</p>
            )}
            <p className="mt-1 font-serif text-xs italic text-[#8f795e]">
              Receberam: {recebedores.length ? recebedores.join(', ') : 'ninguém ainda'}
            </p>
          </div>
          {podeEditar && (
            <div className="flex flex-wrap gap-2">
              <ToolbarButton
                onClick={() => {
                  setEditando(recompensa);
                  setFormularioAberto(true);
                }}
              >
                Editar
              </ToolbarButton>
              <ToolbarButton onClick={() => void excluir(recompensa)}>Excluir</ToolbarButton>
              <ToolbarButton
                variant="primary"
                icon={<HandCoins className="h-3.5 w-3.5" />}
                onClick={() => setEntregando(recompensa)}
              >
                Entregar
              </ToolbarButton>
            </div>
          )}
        </div>
        {!podeGerir && liberada(recompensa) && meusElegiveis.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {meusElegiveis.map((personagem) => (
              <ToolbarButton
                key={personagem.id}
                variant="primary"
                icon={<HandCoins className="h-3.5 w-3.5" />}
                onClick={() => void resgatar(recompensa, personagem.id)}
              >
                Resgatar — {personagem.nome}
              </ToolbarButton>
            ))}
          </div>
        )}
      </li>
    );
  };

  const mercadorias = recompensas.filter((recompensa) => recompensa.tipo === 'item');
  const premios = recompensas.filter((recompensa) => recompensa.tipo !== 'item');
  const grupos = new Map<string, RecompensaDaCronica[]>();
  premios.forEach((recompensa) => {
    const chave = recompensa.objetivoId ?? 'final';
    grupos.set(chave, [...(grupos.get(chave) ?? []), recompensa]);
  });
  const chavesOrdenadas = [...grupos.keys()].sort((a, b) => (a === 'final' ? 1 : b === 'final' ? -1 : 0));

  const carregando = isLoading || objetivos.isLoading || participantes.isLoading;
  const falha = error ?? objetivos.error ?? participantes.error;

  return (
    <>
      <PainelSecao
        title="Recompensas e mercadorias"
        icon={<Gift className="h-4 w-4" />}
        extra={
          podeEditar ? (
            <ToolbarButton
              variant="primary"
              onClick={() => {
                setEditando(undefined);
                setFormularioAberto(true);
              }}
            >
              Nova recompensa
            </ToolbarButton>
          ) : null
        }
      >
        {carregando ? (
          <LoadingState variant="text" label="Carregando recompensas…" />
        ) : falha ? (
          <ErrorState
            description={falha}
            onRetry={() => {
              reload();
              objetivos.reload();
              participantes.reload();
            }}
          />
        ) : recompensas.length === 0 ? (
          <p className="font-serif text-sm italic text-[#8f795e]">Nenhuma recompensa registrada.</p>
        ) : (
          <div className="space-y-5">
            <section aria-label="Mercadorias vinculadas">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-cinzel text-[10px] uppercase tracking-[0.16em] text-[#c6a66d]">
                  Mercadorias vinculadas
                </h3>
                {podeEditar && (
                  <ToolbarButton
                    icon={<Package className="h-3.5 w-3.5" />}
                    onClick={() => setSelecionandoLoot(true)}
                  >
                    Vincular mercadoria
                  </ToolbarButton>
                )}
              </div>
              {mercadorias.length === 0 ? (
                <p className="font-serif text-xs italic text-[#8f795e]">Nenhuma mercadoria vinculada.</p>
              ) : (
                <ul className="space-y-2">{mercadorias.map(renderizarRecompensa)}</ul>
              )}
            </section>

            <section aria-label="Recompensas">
              <h3 className="mb-2 font-cinzel text-[10px] uppercase tracking-[0.16em] text-[#c6a66d]">Recompensas</h3>
              {premios.length === 0 ? (
                <p className="font-serif text-xs italic text-[#8f795e]">Nenhuma recompensa registrada.</p>
              ) : (
                chavesOrdenadas.map((chave) => (
                  <div key={chave} className="mb-3 last:mb-0">
                    <h4 className="mb-1 font-serif text-sm italic text-[#a88d61]">
                      {chave === 'final'
                        ? 'Conclusão da crônica'
                        : objetivos.objetivos.find((objetivo) => objetivo.id === chave)?.titulo ?? 'Objetivo removido'}
                    </h4>
                    <ul className="space-y-2">{grupos.get(chave)?.map(renderizarRecompensa)}</ul>
                  </div>
                ))
              )}
            </section>
          </div>
        )}
        {erro && <p role="alert" className="mt-3 font-serif text-sm text-red-300">{erro}</p>}
      </PainelSecao>

      <RecompensaDaCronicaModal
        isOpen={formularioAberto}
        recompensa={editando}
        objetivos={objetivos.objetivos}
        onClose={() => setFormularioAberto(false)}
        onSave={salvar}
      />

      <SeletorDeLootModal
        isOpen={selecionandoLoot}
        onClose={() => setSelecionandoLoot(false)}
        cronicaId={cronica.id}
        objetivos={objetivos.objetivos}
        jaVinculadas={mercadorias.flatMap((recompensa) => (recompensa.itemId ? [recompensa.itemId] : []))}
        onDone={recarregar}
      />

      {entregando && (
        <EntregarRecompensaModal
          key={entregando.id}
          isOpen
          rewardId={entregando.id}
          participantes={participantes.participantes}
          entreguesA={entregando.entreguesA}
          onClose={() => setEntregando(undefined)}
          onDone={recarregar}
        />
      )}
    </>
  );
};

export default RecompensasDaCronicaPanel;
