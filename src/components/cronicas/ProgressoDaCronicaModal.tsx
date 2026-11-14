import React, { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import type { ObjetivoDaCronica } from '@/types';
import { cronicaService } from '@/services/cronicaService';
import { enviarImagem } from '@/services/mediaService';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';

export interface ProgressoDaCronicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Progresso aberto; ausente quando é um progresso novo. */
  objetivo?: ObjetivoDaCronica;
  /** Necessário apenas para criar um progresso novo. */
  cronicaId: string;
  /** Libera título, detalhes e imagem. Na coluna Progresso o modal é só leitura. */
  editavel: boolean;
  /** Só o Mestre autor marca a conclusão. */
  podeGerir: boolean;
  /** Chamado depois de salvar ou alternar a conclusão, para recarregar a lista. */
  onAlterado: () => void;
}

const inputClassName =
  'w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2.5 text-sm text-[#e6ddc5] outline-none transition-colors placeholder:text-[#6f5c47] focus:border-[#b89558] focus:ring-1 focus:ring-[#b89558]/50';
const labelClassName = 'font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]';
const cancelClassName =
  'border border-[#4b3823] bg-[#120d09] px-4 py-2 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]';

export const ProgressoDaCronicaModal: React.FC<ProgressoDaCronicaModalProps> = ({
  isOpen,
  onClose,
  objetivo,
  cronicaId,
  editavel,
  podeGerir,
  onAlterado,
}) => {
  const [titulo, setTitulo] = useState('');
  const [detalhes, setDetalhes] = useState('');
  const [imagemUrl, setImagemUrl] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [alternando, setAlternando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    setTitulo(objetivo?.titulo ?? '');
    setDetalhes(objetivo?.detalhes ?? '');
    setImagemUrl(objetivo?.imagemUrl ?? '');
    setArquivo(null);
    setConcluido(objetivo?.concluido ?? false);
    setSalvando(false);
    setAlternando(false);
    setErro('');
  }, [isOpen, objetivo]);

  useEffect(() => {
    if (imagemUrl.startsWith('blob:')) return () => URL.revokeObjectURL(imagemUrl);
    return undefined;
  }, [imagemUrl]);

  const salvar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const url = arquivo ? await enviarImagem(arquivo, 'cronicas') : undefined;
      const dados = { titulo, detalhes, imagemUrl: url ?? (imagemUrl || undefined) };
      if (objetivo) await cronicaService.atualizarObjetivo(objetivo.id, dados);
      else await cronicaService.criarObjetivo(cronicaId, dados);
      onAlterado();
      onClose();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível salvar o progresso.');
    } finally {
      setSalvando(false);
    }
  };

  const alternarConclusao = async (concluido: boolean) => {
    if (!objetivo) return;
    setErro('');
    setAlternando(true);
    try {
      // Esta alteração faz o banco recalcular chronicles.progresso.
      await cronicaService.alternarObjetivo(objetivo.id, concluido);
      setConcluido(concluido);
      onAlterado();
    } catch (cause) {
      setErro(cause instanceof Error ? cause.message : 'Não foi possível atualizar o progresso.');
    } finally {
      setAlternando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={objetivo ? 'Progresso' : 'Novo progresso'}
      subtitle={editavel ? 'Imagem, título e detalhes do progresso' : 'Detalhes do progresso'}
      maxWidth="max-w-[640px]"
    >
      {editavel ? (
        <form onSubmit={(event) => void salvar(event)} className="space-y-5">
          <label className="block space-y-1.5">
            <span className={labelClassName}>Título</span>
            <input required value={titulo} onChange={(event) => setTitulo(event.target.value)} className={inputClassName} />
          </label>
          <label className="block space-y-1.5">
            <span className={labelClassName}>Detalhes</span>
            <textarea
              value={detalhes}
              onChange={(event) => setDetalhes(event.target.value)}
              className={`${inputClassName} min-h-[120px] resize-y`}
            />
          </label>
          <div className="space-y-2">
            <span className={labelClassName}>Imagem</span>
            <label className="flex min-h-[84px] cursor-pointer items-center justify-center gap-2 border border-dashed border-[#70552f] bg-[#0d0906] px-3 text-center font-serif text-sm text-[#b89558] transition-colors hover:border-[#d1a85a] hover:bg-[#1a110b]">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
              <span>{imagemUrl ? 'Imagem selecionada' : 'Escolher imagem'}</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const selecionado = event.target.files?.[0] ?? null;
                  setArquivo(selecionado);
                  setImagemUrl(selecionado ? URL.createObjectURL(selecionado) : objetivo?.imagemUrl ?? '');
                }}
              />
            </label>
            {imagemUrl && <img src={imagemUrl} alt="Prévia da imagem do progresso" className="h-16 w-12 border border-[#70552f] object-cover" />}
          </div>
          {objetivo && podeGerir && (
            <label className="flex items-center gap-2 font-serif text-sm text-[#c6a66d]">
              <input
                type="checkbox"
                checked={concluido}
                disabled={alternando}
                onChange={(event) => void alternarConclusao(event.target.checked)}
                className="accent-[#b89558]"
              />
              Progresso concluído
            </label>
          )}
          {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
          <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#3a2c1d] pt-4 sm:flex-row">
            <button type="button" onClick={onClose} disabled={salvando} className={cancelClassName}>Cancelar</button>
            <GothicButton type="submit" size="sm" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar progresso'}
            </GothicButton>
          </div>
        </form>
      ) : (
        <div className="space-y-5">
          {objetivo?.imagemUrl && (
            <img src={objetivo.imagemUrl} alt={`Imagem do progresso ${objetivo.titulo}`} className="h-auto max-w-[240px] border border-[#70552f] object-cover" />
          )}
          {objetivo && (
            <>
              <h3 className="font-cinzel text-lg font-bold text-[#e0bd71]">{objetivo.titulo}</h3>
              {objetivo.detalhes && <p className="whitespace-pre-wrap font-serif text-sm text-[#c4b9a3]">{objetivo.detalhes}</p>}
              <p className="inline-flex border border-[#4b3823] bg-[#120d09] px-2 py-1 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61]">
                {concluido ? 'Concluído' : 'Andamento'}
              </p>
            </>
          )}
          {objetivo && podeGerir && (
            <label className="flex items-center gap-2 font-serif text-sm text-[#c6a66d]">
              <input
                type="checkbox"
                checked={concluido}
                disabled={alternando}
                onChange={(event) => void alternarConclusao(event.target.checked)}
                className="accent-[#b89558]"
              />
              Progresso concluído
            </label>
          )}
          {erro && <p role="alert" className="font-serif text-sm text-red-300">{erro}</p>}
          <div className="flex justify-end border-t border-[#3a2c1d] pt-4">
            <button type="button" onClick={onClose} className={cancelClassName}>Fechar</button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProgressoDaCronicaModal;
