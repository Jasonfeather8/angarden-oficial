import React, { useState } from 'react';
import { ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { cronicaService } from '@/services/cronicaService';
import type { Cronica, ObjetivoDaCronica } from '@/types';
import { BarraProgresso } from '../ui/BarraProgresso';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { LoadingState } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { ProgressoDaCronicaModal } from './ProgressoDaCronicaModal';
import { useObjetivosDaCronica } from './useObjetivosDaCronica';

const inputClassName =
  'min-w-0 flex-1 border border-[#4b3823] bg-[#0d0906] px-2 py-1.5 text-sm text-[#e6ddc5] outline-none focus:border-[#b89558]';

export interface ChecklistDaCronicaPanelProps {
  cronica: Cronica;
  podeGerir: boolean;
  /** A crônica mudou (progresso, por exemplo): a tela recarrega a lista. */
  onCronicaAlterada: () => void;
}

/**
 * Progressos da crônica dentro do modal de criação/edição: o Mestre cria cada
 * progresso (título, detalhes e imagem) e marca a conclusão. O progresso da
 * crônica é derivado do checklist pelo banco; sem progressos, o Mestre informa
 * a porcentagem à mão.
 */
export const ChecklistDaCronicaPanel: React.FC<ChecklistDaCronicaPanelProps> = ({
  cronica,
  podeGerir,
  onCronicaAlterada,
}) => {
  const { objetivos, isLoading, error, reload } = useObjetivosDaCronica(cronica.id);
  const [progressoEmEdicao, setProgressoEmEdicao] = useState<ObjetivoDaCronica | undefined>(undefined);
  const [criandoProgresso, setCriandoProgresso] = useState(false);
  const [progressoManual, setProgressoManual] = useState(String(cronica.progresso));
  const [erro, setErro] = useState('');

  const executar = async (acao: () => Promise<unknown>) => {
    setErro('');
    try {
      await acao();
      reload();
      onCronicaAlterada();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível atualizar o checklist.');
    }
  };

  const salvarProgresso = () => {
    void executar(() =>
      cronicaService.definirProgresso(cronica.id, Math.min(100, Math.max(0, Number(progressoManual) || 0))),
    );
  };

  const abrirNovoProgresso = () => {
    setProgressoEmEdicao(undefined);
    setCriandoProgresso(true);
  };

  const abrirEdicaoDoProgresso = (objetivo: ObjetivoDaCronica) => {
    setCriandoProgresso(false);
    setProgressoEmEdicao(objetivo);
  };

  const fecharModalDoProgresso = () => {
    setCriandoProgresso(false);
    setProgressoEmEdicao(undefined);
  };

  const concluidos = objetivos.filter((objetivo) => objetivo.concluido).length;
  // Com checklist, o percentual sai dos próprios objetivos: é o mesmo número que
  // o banco grava em `chronicles.progresso`, sem depender de uma cópia antiga.
  const percentual = objetivos.length > 0 ? Math.round((100 * concluidos) / objetivos.length) : cronica.progresso;

  return (
    <>
      <PainelSecao title="Checklist da crônica" icon={<ListChecks className="h-4 w-4" />} hint={`${concluidos}/${objetivos.length}`}>
        {isLoading ? (
          <LoadingState variant="text" label="Carregando progressos…" />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : (
          <div className="space-y-4">
            {objetivos.length > 0 ? (
              <ul className="space-y-2">
                {objetivos.map((objetivo) => (
                  <li key={objetivo.id} className="flex flex-wrap items-center gap-2">
                    <span className="flex h-9 w-7 shrink-0 overflow-hidden border border-[#5a4225] bg-[#241a11]">
                      {objetivo.imagemUrl ? (
                        <img
                          src={objetivo.imagemUrl}
                          alt={`Imagem do progresso ${objetivo.titulo}`}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="h-full w-full bg-[radial-gradient(circle_at_65%_25%,#d59b4d_0%,#663317_42%,#160805_100%)]"
                        />
                      )}
                    </span>
                    <label className="flex min-w-0 flex-1 items-center gap-2 font-serif text-sm text-[#d6c4ae]">
                      <input
                        type="checkbox"
                        checked={objetivo.concluido}
                        disabled={!podeGerir}
                        onChange={(event) => void executar(() => cronicaService.alternarObjetivo(objetivo.id, event.target.checked))}
                        aria-label={`Marcar ${objetivo.titulo} como ${objetivo.concluido ? 'não concluído' : 'concluído'}`}
                        className="accent-[#b89558]"
                      />
                      <span className={objetivo.concluido ? 'line-through opacity-60' : ''}>{objetivo.titulo}</span>
                    </label>
                    {podeGerir && (
                      <>
                        <ToolbarButton
                          aria-label={`Editar ${objetivo.titulo}`}
                          icon={<Pencil className="h-3.5 w-3.5" />}
                          onClick={() => abrirEdicaoDoProgresso(objetivo)}
                        >
                          Editar
                        </ToolbarButton>
                        <ToolbarButton
                          aria-label={`Excluir ${objetivo.titulo}`}
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => void executar(() => cronicaService.excluirObjetivo(objetivo.id))}
                        >
                          Excluir
                        </ToolbarButton>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-serif text-sm italic text-[#8f795e]">Nenhum progresso registrado.</p>
            )}

            {objetivos.length > 0 ? (
              <BarraProgresso
                rotulo="Progresso"
                atual={concluidos}
                max={objetivos.length}
                valorTexto={`${percentual}%`}
                limiarCritico={0}
              />
            ) : podeGerir ? (
              <div className="space-y-2">
                <label htmlFor={`progresso-${cronica.id}`} className="block font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]">
                  Progresso informado à mão (%)
                </label>
                <div className="flex gap-2">
                  <input
                    id={`progresso-${cronica.id}`}
                    type="number"
                    min="0"
                    max="100"
                    value={progressoManual}
                    onChange={(event) => setProgressoManual(event.target.value)}
                    className={`${inputClassName} max-w-24`}
                  />
                  <ToolbarButton type="button" onClick={salvarProgresso}>Salvar progresso</ToolbarButton>
                </div>
                <p className="font-serif text-xs italic text-[#806b53]">
                  Sem checklist, o progresso é informado à mão.
                </p>
              </div>
            ) : (
              <p className="font-cinzel text-xl text-[#d1a85a]">{cronica.progresso}%</p>
            )}

            {podeGerir && (
              <div className="border-t border-[#2e2216] pt-3">
                <ToolbarButton
                  type="button"
                  variant="primary"
                  icon={<Plus className="h-3.5 w-3.5" />}
                  onClick={abrirNovoProgresso}
                >
                  Adicionar progresso
                </ToolbarButton>
              </div>
            )}

            {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
          </div>
        )}
      </PainelSecao>

      <ProgressoDaCronicaModal
        isOpen={criandoProgresso || Boolean(progressoEmEdicao)}
        onClose={fecharModalDoProgresso}
        objetivo={progressoEmEdicao}
        cronicaId={cronica.id}
        editavel
        podeGerir={podeGerir}
        onAlterado={() => {
          reload();
          onCronicaAlterada();
        }}
      />
    </>
  );
};

export default ChecklistDaCronicaPanel;
