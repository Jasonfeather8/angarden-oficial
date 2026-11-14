import React, { useState } from 'react';
import { Check, Edit3, Link, RotateCcw, Trash2 } from 'lucide-react';
import { cronicaService } from '@/services/cronicaService';
import type { Cronica } from '@/types';
import { ToolbarButton } from '../ui/ToolbarButton';

export interface CronicaAcoesBarProps {
  cronica: Cronica;
  /** Só o Mestre autor da crônica (ou o administrador) gere a crônica. */
  podeGerir: boolean;
  abrirEdicao: (cronica: Cronica) => void;
  abrirCompartilhar: () => void;
  abrirExclusao: () => void;
  onAlterada: () => void;
}

/** Barra única de ações da crônica em leitura. */
export const CronicaAcoesBar: React.FC<CronicaAcoesBarProps> = ({
  cronica,
  podeGerir,
  abrirEdicao,
  abrirCompartilhar,
  abrirExclusao,
  onAlterada,
}) => {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  if (!podeGerir) return null;

  const concluida = cronica.status === 'CONCLUIDA';

  const alternarConclusao = async () => {
    setSalvando(true);
    setErro('');
    try {
      await cronicaService.concluir(cronica.id, !concluida);
      onAlterada();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível atualizar a crônica.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Ações da crônica">
        <ToolbarButton icon={<Edit3 className="h-3.5 w-3.5" />} onClick={() => abrirEdicao(cronica)}>
          Editar
        </ToolbarButton>
        <ToolbarButton
          disabled={salvando}
          icon={concluida ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
          onClick={() => void alternarConclusao()}
        >
          {concluida ? 'Reabrir crônica' : 'Concluir crônica'}
        </ToolbarButton>
        <ToolbarButton icon={<Link className="h-3.5 w-3.5" />} onClick={abrirCompartilhar}>
          Compartilhar
        </ToolbarButton>
        <ToolbarButton variant="secondary" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={abrirExclusao}>
          Excluir
        </ToolbarButton>
      </div>
      {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
    </div>
  );
};

export default CronicaAcoesBar;
