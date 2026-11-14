import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { cronicaService } from '@/services/cronicaService';
import type { CategoriaCronica } from '@/types';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';
import { ToolbarButton } from '../ui/ToolbarButton';

const inputClassName =
  'min-w-0 flex-1 border border-[#4b3823] bg-[#0d0906] px-3 py-2 text-sm text-[#e6ddc5] outline-none focus:border-[#b89558]';

export interface GerenciarCategoriasModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: CategoriaCronica[];
  /** Recarrega as categorias e as crônicas (a lista usa o nome da categoria). */
  onAlteradas: () => void;
}

/** Categorias das crônicas: uma categoria reúne várias crônicas. */
export const GerenciarCategoriasModal: React.FC<GerenciarCategoriasModalProps> = ({
  isOpen,
  onClose,
  categorias,
  onAlteradas,
}) => {
  const [nome, setNome] = useState('');
  const [editando, setEditando] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState<CategoriaCronica | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState('');

  const executar = async (acao: () => Promise<unknown>) => {
    setOcupado(true);
    setErro('');
    try {
      await acao();
      onAlteradas();
      setEditando(null);
      setExcluindo(null);
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível atualizar as categorias.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Gerenciar categorias"
        subtitle="Uma categoria reúne várias crônicas"
        maxWidth="max-w-[620px]"
      >
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!nome.trim()) return;
            void executar(() => cronicaService.criarCategoria(nome));
            setNome('');
          }}
        >
          <label htmlFor="nova-categoria" className="sr-only">Nome da nova categoria</label>
          <input
            id="nova-categoria"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            placeholder="Nova categoria"
            className={inputClassName}
          />
          <ToolbarButton type="submit" disabled={ocupado} icon={<Plus className="h-4 w-4" />}>Criar</ToolbarButton>
        </form>

        {categorias.length === 0 ? (
          <p className="font-serif text-sm italic text-[#8f795e]">Nenhuma categoria criada.</p>
        ) : (
          <ul className="space-y-2">
            {categorias.map((categoria) => (
              <li key={categoria.id} className="flex flex-wrap items-center gap-2 border border-[#3a2c1d] bg-[#120d09] p-2">
                {editando === categoria.id ? (
                  <form
                    className="flex min-w-0 flex-1 gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const valor = String(new FormData(event.currentTarget).get('nome') ?? '').trim();
                      if (!valor) return;
                      void executar(() => cronicaService.renomearCategoria(categoria.id, valor));
                    }}
                  >
                    <input
                      name="nome"
                      defaultValue={categoria.nome}
                      aria-label={`Novo nome para ${categoria.nome}`}
                      className={inputClassName}
                    />
                    <ToolbarButton type="submit" disabled={ocupado}>Salvar</ToolbarButton>
                  </form>
                ) : (
                  <span className="min-w-0 flex-1 font-serif text-sm text-[#d6c4ae]">{categoria.nome}</span>
                )}
                <ToolbarButton
                  aria-label={`Renomear ${categoria.nome}`}
                  icon={<Pencil className="h-3.5 w-3.5" />}
                  onClick={() => setEditando(categoria.id)}
                >
                  Renomear
                </ToolbarButton>
                <ToolbarButton
                  aria-label={`Excluir ${categoria.nome}`}
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => setExcluindo(categoria)}
                >
                  Excluir
                </ToolbarButton>
              </li>
            ))}
          </ul>
        )}

        <p className="font-serif text-xs italic text-[#806b53]">
          Ao excluir uma categoria, as crônicas vinculadas ficam “Sem categoria”.
        </p>
        {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
      </Modal>

      <Modal
        isOpen={Boolean(excluindo)}
        onClose={() => setExcluindo(null)}
        title="Excluir categoria"
        zIndex="z-[60]"
      >
        <p className="font-serif text-sm text-[#d6c4ae]">
          Excluir <strong className="text-[#f0d79b]">{excluindo?.nome}</strong>? As crônicas vinculadas ficarão “Sem
          categoria”.
        </p>
        <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#3a2c1d] pt-4 sm:flex-row">
          <button
            type="button"
            onClick={() => setExcluindo(null)}
            className="border border-[#4b3823] bg-[#120d09] px-4 py-2 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]"
          >
            Cancelar
          </button>
          <GothicButton
            variant="danger"
            size="sm"
            width={190}
            height={38}
            disabled={ocupado}
            onClick={() => {
              if (excluindo) void executar(() => cronicaService.excluirCategoria(excluindo.id));
            }}
          >
            {ocupado ? 'Excluindo…' : 'Excluir categoria'}
          </GothicButton>
        </div>
      </Modal>
    </>
  );
};

export default GerenciarCategoriasModal;
