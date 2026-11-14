import React, { useState } from 'react';
import { Eye, EyeOff, NotebookPen, Plus, Trash2 } from 'lucide-react';
import { cronicaService } from '@/services/cronicaService';
import type { Cronica, NotaDaCronica } from '@/types';
import { ErrorState } from '../ui/ErrorState';
import { PainelSecao } from '../ui/PainelSecao';
import { LoadingState } from '../ui/Skeleton';
import { ToolbarButton } from '../ui/ToolbarButton';
import { NotaDaCronicaModal } from './NotaDaCronicaModal';
import { useNotasDaCronica } from './useNotasDaCronica';

export interface NotasDaCronicaPanelProps {
  cronica: Cronica;
  podeGerir: boolean;
  onCronicaAlterada: () => void;
}

/**
 * Notas do Mestre. A nota só chega ao jogador quando a crônica libera as notas
 * e a própria nota está marcada como visível.
 */
export const NotasDaCronicaPanel: React.FC<NotasDaCronicaPanelProps> = ({
  cronica,
  podeGerir,
  onCronicaAlterada,
}) => {
  const { notas, isLoading, error, reload } = useNotasDaCronica(cronica.id);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<NotaDaCronica | undefined>(undefined);
  const [erro, setErro] = useState('');

  const salvar = async (dados: Omit<NotaDaCronica, 'id' | 'criadaEm' | 'autorId'>) => {
    if (editando) await cronicaService.atualizarNota(editando.id, dados);
    else await cronicaService.criarNota(cronica.id, dados);
    reload();
  };

  const alternarVisibilidadeDaCronica = async (visivel: boolean) => {
    setErro('');
    try {
      await cronicaService.definirNotasVisiveis(cronica.id, visivel);
      onCronicaAlterada();
      reload();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível alterar a visibilidade das notas.');
    }
  };

  const excluir = async (nota: NotaDaCronica) => {
    setErro('');
    try {
      await cronicaService.excluirNota(nota.id);
      reload();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível excluir a nota.');
    }
  };

  const visiveis = notas.filter(
    (nota) => podeGerir || (cronica.notasVisiveis && nota.visivelJogadores),
  );

  const extra = podeGerir ? (
    <div className="flex flex-wrap items-center gap-2">
      <label className="flex items-center gap-1.5 font-serif text-xs text-[#c6a66d]">
        <input
          type="checkbox"
          checked={cronica.notasVisiveis}
          onChange={(event) => void alternarVisibilidadeDaCronica(event.target.checked)}
          aria-label="Notas visíveis para os jogadores"
          className="accent-[#b89558]"
        />
        Notas visíveis para os jogadores
      </label>
      <ToolbarButton
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => {
          setEditando(undefined);
          setModalAberto(true);
        }}
      >
        Nova nota
      </ToolbarButton>
    </div>
  ) : null;

  return (
    <>
      <PainelSecao title="Notas do Mestre" icon={<NotebookPen className="h-4 w-4" />} extra={extra}>
        {isLoading ? (
          <LoadingState variant="text" label="Carregando notas…" />
        ) : error ? (
          <ErrorState description={error} onRetry={reload} />
        ) : visiveis.length === 0 ? (
          <p className="font-serif text-sm italic text-[#8f795e]">Nenhuma nota registrada.</p>
        ) : (
          <div className="space-y-3">
            {visiveis.map((nota) => (
              <article key={nota.id} className="border border-[#3a2c1d] bg-[#120d09] p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="font-cinzel text-sm font-bold text-[#e0bd71]">{nota.titulo}</h3>
                  {podeGerir && (
                    <span className="flex items-center gap-1 font-serif text-xs text-[#a88d61]">
                      {nota.visivelJogadores ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {nota.visivelJogadores ? 'Visível' : 'Oculta'}
                    </span>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-wrap font-serif text-sm text-[#c4b9a3]">
                  {nota.conteudo.length > 220 ? `${nota.conteudo.slice(0, 220)}…` : nota.conteudo}
                </p>
                {podeGerir && (
                  <div className="mt-2 flex gap-2">
                    <ToolbarButton
                      onClick={() => {
                        setEditando(nota);
                        setModalAberto(true);
                      }}
                    >
                      Editar
                    </ToolbarButton>
                    <ToolbarButton
                      icon={<Trash2 className="h-3.5 w-3.5" />}
                      onClick={() => void excluir(nota)}
                    >
                      Excluir
                    </ToolbarButton>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        {erro && <p role="alert" className="mt-3 font-serif text-sm text-red-300">{erro}</p>}
      </PainelSecao>

      <NotaDaCronicaModal
        isOpen={modalAberto}
        nota={editando}
        onClose={() => setModalAberto(false)}
        onSave={salvar}
      />
    </>
  );
};

export default NotasDaCronicaPanel;
