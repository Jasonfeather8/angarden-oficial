import React, { useState } from 'react';
import { ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { cronicaService } from '@/services/cronicaService';
import type { Cronica } from '@/types';
import { BarraProgresso } from '../ui/BarraProgresso';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { LoadingState } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
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
 * Objetivos da crônica. O progresso da crônica é derivado do checklist pelo
 * banco; sem objetivos, o Mestre autor informa a porcentagem à mão.
 */
export const ChecklistDaCronicaPanel: React.FC<ChecklistDaCronicaPanelProps> = ({
  cronica,
  podeGerir,
  onCronicaAlterada,
}) => {
  const { objetivos, isLoading, error, reload } = useObjetivosDaCronica(cronica.id);
  const [novoTitulo, setNovoTitulo] = useState('');
  const [progressoManual, setProgressoManual] = useState(String(cronica.progresso));
  const [renomeando, setRenomeando] = useState<string | null>(null);
  const [erro, setErro] = useState('');

  const executar = async (acao: () => Promise<unknown>, recarregarLista = true) => {
    setErro('');
    try {
      await acao();
      if (recarregarLista) reload();
      onCronicaAlterada();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível atualizar o checklist.');
    }
  };

  const concluidos = objetivos.filter((objetivo) => objetivo.concluido).length;

  return (
    <PainelSecao title="Checklist da crônica" icon={<ListChecks className="h-4 w-4" />} hint={`${concluidos}/${objetivos.length}`}>
      {isLoading ? (
        <LoadingState variant="text" label="Carregando objetivos…" />
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : (
        <div className="space-y-4">
          {objetivos.length > 0 ? (
            <ul className="space-y-2">
              {objetivos.map((objetivo) => (
                <li key={objetivo.id} className="flex flex-wrap items-center gap-2">
                  {renomeando === objetivo.id ? (
                    <form
                      className="flex min-w-0 flex-1 items-center gap-2"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const titulo = String(new FormData(event.currentTarget).get('titulo') ?? '').trim();
                        if (!titulo) return;
                        void executar(() => cronicaService.renomearObjetivo(objetivo.id, titulo)).then(() =>
                          setRenomeando(null),
                        );
                      }}
                    >
                      <input name="titulo" defaultValue={objetivo.titulo} aria-label={`Novo título para ${objetivo.titulo}`} className={inputClassName} />
                      <ToolbarButton type="submit">Salvar</ToolbarButton>
                    </form>
                  ) : (
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
                  )}
                  {podeGerir && renomeando !== objetivo.id && (
                    <>
                      <ToolbarButton
                        aria-label={`Renomear ${objetivo.titulo}`}
                        icon={<Pencil className="h-3.5 w-3.5" />}
                        onClick={() => setRenomeando(objetivo.id)}
                      >
                        Renomear
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
            <p className="font-serif text-sm italic text-[#8f795e]">Nenhum objetivo registrado.</p>
          )}

          {objetivos.length > 0 ? (
            <BarraProgresso
              rotulo="Progresso"
              atual={concluidos}
              max={objetivos.length}
              valorTexto={`${cronica.progresso}%`}
            />
          ) : podeGerir ? (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void executar(
                  () => cronicaService.definirProgresso(cronica.id, Math.min(100, Math.max(0, Number(progressoManual) || 0))),
                  false,
                );
              }}
            >
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
                <ToolbarButton type="submit">Salvar progresso</ToolbarButton>
              </div>
              <p className="font-serif text-xs italic text-[#806b53]">
                Sem checklist, o progresso é informado à mão.
              </p>
            </form>
          ) : (
            <p className="font-cinzel text-xl text-[#d1a85a]">{cronica.progresso}%</p>
          )}

          {podeGerir && (
            <form
              className="flex gap-2 border-t border-[#2e2216] pt-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!novoTitulo.trim()) return;
                void executar(() => cronicaService.criarObjetivo(cronica.id, novoTitulo)).then(() => setNovoTitulo(''));
              }}
            >
              <label htmlFor={`objetivo-${cronica.id}`} className="sr-only">Novo objetivo</label>
              <input
                id={`objetivo-${cronica.id}`}
                value={novoTitulo}
                onChange={(event) => setNovoTitulo(event.target.value)}
                placeholder="Adicionar objetivo"
                className={inputClassName}
              />
              <ToolbarButton type="submit" icon={<Plus className="h-3.5 w-3.5" />}>Adicionar</ToolbarButton>
            </form>
          )}

          {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
        </div>
      )}
    </PainelSecao>
  );
};

export default ChecklistDaCronicaPanel;
