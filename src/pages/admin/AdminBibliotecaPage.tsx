import React, { useState } from 'react';
import { Eye, EyeOff, FileText, Pencil, Plus, Scroll, Trash2, UploadCloud } from 'lucide-react';
import { GothicButton } from '@/components/GothicButton';
import { MedievalFrame } from '@/components/MedievalFrame';
import { Modal } from '@/components/Modal';
import { FormularioMaterialBiblioteca } from '@/components/biblioteca/FormularioMaterialBiblioteca';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingState } from '@/components/ui/Skeleton';
import { ToolbarButton } from '@/components/ui/ToolbarButton';
import { formatarTamanhoArquivo, rotuloCategoria } from '@/config/biblioteca';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuthorization } from '@/hooks/useAuthorization';
import { bibliotecaService } from '@/services/bibliotecaService';
import { cacheKeys } from '@/services/cacheKeys';
import type { ItemBiblioteca } from '@/types';

/**
 * Gestão do acervo da Biblioteca, na área administrativa da plataforma.
 * O acervo é catálogo global: todo cliente ativo lê, e só o Administrador
 * publica — a decisão também está na RLS de `library_items`.
 */
export const AdminBibliotecaPage: React.FC = () => {
  const { role } = useAuthorization();
  const { data, isLoading, error, reload } = useAsyncData(
    () => bibliotecaService.listarAcervo(),
    [],
    { cacheKey: cacheKeys.biblioteca(role) },
  );

  const [formularioAberto, setFormularioAberto] = useState(false);
  const [itemEmEdicao, setItemEmEdicao] = useState<ItemBiblioteca | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<ItemBiblioteca | null>(null);
  const [processando, setProcessando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const itens = data ?? [];
  const ocultos = itens.filter((item) => item.oculto).length;

  const abrirFormulario = (item: ItemBiblioteca | null) => {
    setItemEmEdicao(item);
    setFormularioAberto(true);
    setAviso(null);
    setErroAcao(null);
  };

  const fecharFormulario = () => {
    setFormularioAberto(false);
    setItemEmEdicao(null);
  };

  const aoSalvar = (mensagem: string) => {
    fecharFormulario();
    setAviso(mensagem);
    setErroAcao(null);
    reload();
  };

  const alternarVisibilidade = async (item: ItemBiblioteca) => {
    setProcessando(true);
    setErroAcao(null);
    try {
      await bibliotecaService.definirVisibilidade(item.id, !item.oculto);
      setAviso(item.oculto ? `"${item.titulo}" voltou ao acervo.` : `"${item.titulo}" ficou oculto para os clientes.`);
      reload();
    } catch (cause) {
      setErroAcao(cause instanceof Error ? cause.message : 'Não foi possível alterar a visibilidade.');
    } finally {
      setProcessando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!itemParaExcluir) return;
    setProcessando(true);
    setErroAcao(null);
    try {
      await bibliotecaService.excluir(itemParaExcluir);
      setAviso(`"${itemParaExcluir.titulo}" saiu do acervo.`);
      setItemParaExcluir(null);
      reload();
    } catch (cause) {
      setErroAcao(cause instanceof Error ? cause.message : 'Não foi possível excluir o material.');
    } finally {
      setProcessando(false);
    }
  };

  return (
    <MedievalFrame
      title="Biblioteca"
      subtitle="Acervo oficial de Angarden"
      contentClassName="space-y-5"
    >
      <p className="font-serif text-sm text-[#c4b9a3]">
        Publique os manuais oficiais em PDF e os pergaminhos de notas. O acervo fica disponível para
        todos os clientes da plataforma; material oculto continua visível apenas para você.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3a2c1d] pb-3">
        <p className="font-serif text-xs text-[#8c6b41]">
          {itens.length} material(is) no acervo · {ocultos} oculto(s)
        </p>
        {!formularioAberto && (
          <ToolbarButton variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => abrirFormulario(null)}>
            Novo material
          </ToolbarButton>
        )}
      </div>

      {formularioAberto && (
        <section
          className="border border-[#5a4225] bg-[#0c0806]/80 p-4"
          aria-labelledby="titulo-formulario-material"
        >
          <h2
            id="titulo-formulario-material"
            className="mb-4 flex items-center gap-2 font-cinzel text-sm font-bold uppercase tracking-wider text-[#d4af37]"
          >
            {itemEmEdicao ? (
              <Pencil className="h-4 w-4" aria-hidden="true" />
            ) : (
              <UploadCloud className="h-4 w-4" aria-hidden="true" />
            )}
            {itemEmEdicao ? `Editando: ${itemEmEdicao.titulo}` : 'Novo material'}
          </h2>
          <FormularioMaterialBiblioteca
            key={itemEmEdicao?.id ?? 'novo'}
            inicial={itemEmEdicao}
            onSalvo={aoSalvar}
            onCancelar={fecharFormulario}
          />
        </section>
      )}

      {aviso && (
        <p role="status" className="border border-[#5a4225] bg-[#0c0806]/80 px-3 py-2 font-serif text-sm text-[#e0c27e]">
          {aviso}
        </p>
      )}

      {erroAcao && <ErrorState title="Não foi possível concluir a ação" description={erroAcao} />}

      {isLoading ? (
        <LoadingState variant="cards" label="Carregando o acervo…" />
      ) : error ? (
        <ErrorState description={error} onRetry={reload} />
      ) : itens.length === 0 ? (
        <EmptyState
          icon={<Scroll className="h-8 w-8" aria-hidden="true" />}
          title="Acervo vazio"
          description="Publique o primeiro manual ou pergaminho para a Biblioteca."
        />
      ) : (
        <ul className="space-y-2">
          {itens.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-3 border border-[#3a2c1d] bg-[#0c0806]/70 p-3">
              <div className="h-16 w-12 shrink-0 overflow-hidden border border-[#4b3823] bg-[#17110c]">
                {item.capaUrl ? (
                  <img src={item.capaUrl} alt={`Capa de ${item.titulo}`} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[#5a4225]">
                    {item.tipo === 'pdf' ? (
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Scroll className="h-5 w-5" aria-hidden="true" />
                    )}
                  </span>
                )}
              </div>

              <div className="min-w-[12rem] flex-1">
                <p className="font-cinzel text-sm font-bold uppercase tracking-wider text-[#e6ddc5]">
                  {item.titulo}
                </p>
                <p className="font-serif text-xs text-[#a88d61]">
                  {rotuloCategoria(item.categoria)} · {item.tipo === 'pdf' ? 'PDF' : 'Pergaminho'}
                  {item.tipo === 'pdf' && item.arquivoBytes ? ` · ${formatarTamanhoArquivo(item.arquivoBytes)}` : ''}
                  {item.tipo === 'pdf' && item.arquivoUrl ? ' · link externo' : ''}
                </p>
                {item.oculto && (
                  <span className="mt-1 inline-block border border-[#8c6b41] px-1.5 py-0.5 font-cinzel text-[9px] uppercase tracking-wider text-[#e0c27e]">
                    Oculto
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <ToolbarButton icon={<Pencil className="h-4 w-4" />} disabled={processando} onClick={() => abrirFormulario(item)}>
                  Editar
                </ToolbarButton>
                <ToolbarButton
                  icon={item.oculto ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  disabled={processando}
                  onClick={() => void alternarVisibilidade(item)}
                >
                  {item.oculto ? 'Reexibir' : 'Ocultar'}
                </ToolbarButton>
                <ToolbarButton icon={<Trash2 className="h-4 w-4" />} disabled={processando} onClick={() => setItemParaExcluir(item)}>
                  Excluir
                </ToolbarButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        isOpen={Boolean(itemParaExcluir)}
        onClose={() => setItemParaExcluir(null)}
        title="Excluir material"
        maxWidth="max-w-[520px]"
      >
        <p className="font-serif text-sm text-[#dcd1ba]">
          Excluir <strong>{itemParaExcluir?.titulo}</strong> do acervo? O PDF também é removido do
          armazenamento e a ação não pode ser desfeita.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <GothicButton variant="danger" disabled={processando} onClick={() => void confirmarExclusao()}>
            Excluir
          </GothicButton>
          <ToolbarButton disabled={processando} onClick={() => setItemParaExcluir(null)}>
            Cancelar
          </ToolbarButton>
        </div>
      </Modal>
    </MedievalFrame>
  );
};

export default AdminBibliotecaPage;
