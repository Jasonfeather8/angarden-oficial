import React from 'react';
import { Clock3, ImagePlus, Send } from 'lucide-react';
import { clsx } from 'clsx';
import type { CategoriaDeCronica } from '@/types';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';
import type { CampoDoFormulario, ModoDePublicacao, NovaCronicaForm } from './useCronicaForm';

const inputClassName =
  'w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2.5 text-sm text-[#e6ddc5] outline-none transition-colors placeholder:text-[#6f5c47] focus:border-[#b89558] focus:ring-1 focus:ring-[#b89558]/50';

const rotuloClassName = 'font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]';

export interface NovaCronicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  form: NovaCronicaForm;
  onFormChange: (field: CampoDoFormulario, value: string) => void;
  onCategoriaChange: (value: string) => void;
  onNotasVisiveisChange: (value: boolean) => void;
  categorias: CategoriaDeCronica[];
  /** A crônica tem checklist: o progresso passa a ser calculado, não digitado. */
  temChecklist: boolean;
  editando: boolean;
  /** A crônica em edição já foi concluída: o agendamento não se aplica. */
  concluida: boolean;
  onCoverChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  publishMode: ModoDePublicacao;
  onPublishModeChange: (modo: ModoDePublicacao) => void;
  isSaving: boolean;
  saveError: string | null;
}

/** Formulário de uma crônica nova ou da edição de uma existente. */
export const NovaCronicaModal: React.FC<NovaCronicaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  onCategoriaChange,
  onNotasVisiveisChange,
  categorias,
  temChecklist,
  editando,
  concluida,
  onCoverChange,
  publishMode,
  onPublishModeChange,
  isSaving,
  saveError,
}) => {
  const permiteAgendar = !editando || !concluida;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editando ? 'Editar Crônica' : 'Nova Crônica'}
      subtitle={editando ? 'Atualize o relato e os detalhes da sessão' : 'Redija e publique o próximo capítulo da crônica'}
      maxWidth="max-w-[780px]"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className={rotuloClassName}>Título da crônica</span>
            <input
              required
              value={form.titulo}
              onChange={(event) => onFormChange('titulo', event.target.value)}
              className={inputClassName}
              placeholder="Título do capítulo"
            />
          </label>
          <label className="space-y-1.5">
            <span className={rotuloClassName}>Data da aventura</span>
            <input
              required
              type="date"
              value={form.dataAventura}
              onChange={(event) => onFormChange('dataAventura', event.target.value)}
              className={inputClassName}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className={rotuloClassName}>Local da aventura</span>
            <input
              value={form.local}
              onChange={(event) => onFormChange('local', event.target.value)}
              className={inputClassName}
              placeholder="Onde a aventura aconteceu"
            />
          </label>
          <label className="space-y-1.5">
            <span className={rotuloClassName}>Categoria</span>
            <select
              value={form.categoriaId}
              onChange={(event) => onCategoriaChange(event.target.value)}
              className={inputClassName}
            >
              <option value="">Sem categoria</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>
              ))}
            </select>
          </label>
        </div>

        {!temChecklist && (
          <label className="block space-y-1.5">
            <span className={rotuloClassName}>Progresso (%)</span>
            <input
              required
              type="number"
              min="0"
              max="100"
              value={form.progresso}
              onChange={(event) => onFormChange('progresso', event.target.value)}
              className={inputClassName}
            />
            <span className="font-serif text-xs italic text-[#806b53]">
              Sem checklist, o progresso é informado à mão.
            </span>
          </label>
        )}

        <label className="block space-y-1.5">
          <span className={rotuloClassName}>Relato narrativo</span>
          <textarea
            required
            value={form.relato}
            onChange={(event) => onFormChange('relato', event.target.value)}
            className={`${inputClassName} min-h-[150px] resize-y font-garamond text-base`}
            placeholder="Escreva o que aconteceu nesta sessão."
          />
        </label>

        <label className="flex items-center gap-2 font-serif text-sm text-[#c6a66d]">
          <input
            type="checkbox"
            checked={form.notasVisiveis}
            onChange={(event) => onNotasVisiveisChange(event.target.checked)}
            className="accent-[#b89558]"
          />
          Notas visíveis para os jogadores
        </label>

        <div className="space-y-2">
          <span className={rotuloClassName}>Imagem de capa</span>
          <label className="flex min-h-[84px] cursor-pointer items-center justify-center gap-2 border border-dashed border-[#70552f] bg-[#0d0906] px-3 text-center font-serif text-sm text-[#b89558] transition-colors hover:border-[#d1a85a] hover:bg-[#1a110b]">
            <ImagePlus className="h-5 w-5" />
            <span>{form.capaUrl ? 'Capa selecionada' : 'Escolher imagem'}</span>
            <input type="file" accept="image/*" onChange={onCoverChange} className="sr-only" />
          </label>
          {form.capaUrl && (
            <img
              src={form.capaUrl}
              alt="Prévia da capa selecionada"
              className="h-16 w-12 border border-[#70552f] object-cover"
            />
          )}
        </div>

        {permiteAgendar && (
          <div className="border-t border-[#3a2c1d] pt-4">
            <div className="mb-3 flex gap-2" role="group" aria-label="Modo de publicação">
              <button
                type="button"
                aria-pressed={publishMode === 'now'}
                onClick={() => onPublishModeChange('now')}
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 border px-3 py-2 font-cinzel text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#d1a85a]',
                  publishMode === 'now'
                    ? 'border-[#b89558] bg-[#2a1d10] text-[#f0d79b]'
                    : 'border-[#4b3823] bg-[#0d0906] text-[#8d7557]',
                )}
              >
                <Send className="h-3.5 w-3.5" /> Publicar agora
              </button>
              <button
                type="button"
                aria-pressed={publishMode === 'schedule'}
                onClick={() => onPublishModeChange('schedule')}
                className={clsx(
                  'flex flex-1 items-center justify-center gap-2 border px-3 py-2 font-cinzel text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#d1a85a]',
                  publishMode === 'schedule'
                    ? 'border-[#b89558] bg-[#2a1d10] text-[#f0d79b]'
                    : 'border-[#4b3823] bg-[#0d0906] text-[#8d7557]',
                )}
              >
                <Clock3 className="h-3.5 w-3.5" /> Agendar
              </button>
            </div>
            {publishMode === 'schedule' && (
              <label className="block space-y-1.5">
                <span className={rotuloClassName}>Data e hora da publicação</span>
                <input
                  required
                  type="datetime-local"
                  value={form.agendadaPara}
                  onChange={(event) => onFormChange('agendadaPara', event.target.value)}
                  className={inputClassName}
                />
              </label>
            )}
          </div>
        )}

        {saveError && (
          <p role="alert" className="border border-[#7f3d2d] bg-[#2a110d] px-3 py-2 font-serif text-sm text-[#f0b09b]">
            {saveError}
          </p>
        )}

        <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#3a2c1d] pt-4 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="border border-[#4b3823] bg-[#120d09] px-4 py-2 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]"
          >
            Cancelar
          </button>
          <GothicButton
            type="submit"
            size="sm"
            width={190}
            height={38}
            disabled={isSaving}
            icon={publishMode === 'now' ? <Send className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
          >
            {isSaving
              ? 'Salvando…'
              : editando
                ? 'Salvar Crônica'
                : publishMode === 'now'
                  ? 'Publicar Crônica'
                  : 'Agendar Crônica'}
          </GothicButton>
        </div>
      </form>
    </Modal>
  );
};

export default NovaCronicaModal;
