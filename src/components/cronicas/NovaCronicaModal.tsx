import React from 'react';
import { Clock3, ImagePlus, Send } from 'lucide-react';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';
import { ErrorState } from '../ui/ErrorState';
import { LoadingState } from '../ui/Skeleton';
import type { CampoDoFormulario, ModoDePublicacao, NovaCronicaForm } from './useCronicaForm';
import type { PersonagemDaCronica } from './usePersonagensDaCronica';

const inputClassName =
  'w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2.5 text-sm text-[#e6ddc5] outline-none transition-colors placeholder:text-[#6f5c47] focus:border-[#b89558] focus:ring-1 focus:ring-[#b89558]/50';

export interface NovaCronicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  form: NovaCronicaForm;
  onFormChange: (field: CampoDoFormulario, value: string) => void;
  onToggleCharacter: (nome: string) => void;
  onCoverChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  publishMode: ModoDePublicacao;
  onPublishModeChange: (modo: ModoDePublicacao) => void;
  isSaving: boolean;
  saveError: string | null;
  personagens: PersonagemDaCronica[];
  isLoadingPersonagens: boolean;
  erroPersonagens: string | null;
  onReloadPersonagens: () => void;
}

/** Formulário de uma crônica nova: relato, capa, presenças e publicação. */
export const NovaCronicaModal: React.FC<NovaCronicaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  onToggleCharacter,
  onCoverChange,
  publishMode,
  onPublishModeChange,
  isSaving,
  saveError,
  personagens,
  isLoadingPersonagens,
  erroPersonagens,
  onReloadPersonagens,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Nova Crônica"
    subtitle="Redija e publique o próximo capítulo da campanha"
    maxWidth="max-w-[780px]"
  >
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Título da crônica</span>
          <input required value={form.titulo} onChange={(event) => onFormChange('titulo', event.target.value)} className={inputClassName} placeholder="Título do capítulo" />
        </label>
        <label className="space-y-1.5">
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Data da aventura</span>
          <input required type="date" value={form.dataAventura} onChange={(event) => onFormChange('dataAventura', event.target.value)} className={inputClassName} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <label className="space-y-1.5">
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Local da aventura</span>
          <input value={form.local} onChange={(event) => onFormChange('local', event.target.value)} className={inputClassName} placeholder="Onde a aventura aconteceu" />
        </label>
        <label className="space-y-1.5">
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Progresso (%)</span>
          <input required type="number" min="0" max="100" value={form.progresso} onChange={(event) => onFormChange('progresso', event.target.value)} className={inputClassName} />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Relato narrativo</span>
        <textarea required value={form.relato} onChange={(event) => onFormChange('relato', event.target.value)} className={`${inputClassName} min-h-[150px] resize-y font-garamond text-base`} placeholder="Escreva o que aconteceu nesta sessão. Markdown é aceito." />
        <span className="font-serif text-xs italic text-[#806b53]">Descreva os acontecimentos, decisões e consequências deixadas pela mesa.</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Imagem de capa</span>
          <label className="flex min-h-[84px] cursor-pointer items-center justify-center gap-2 border border-dashed border-[#70552f] bg-[#0d0906] px-3 text-center font-serif text-sm text-[#b89558] transition-colors hover:border-[#d1a85a] hover:bg-[#1a110b]">
            <ImagePlus className="h-5 w-5" />
            <span>{form.capaUrl ? 'Capa selecionada' : 'Escolher imagem'}</span>
            <input type="file" accept="image/*" onChange={onCoverChange} className="sr-only" />
          </label>
          {form.capaUrl && <img src={form.capaUrl} alt="Prévia da capa selecionada" className="h-16 w-12 object-cover border border-[#70552f]" />}
        </div>
        <div className="space-y-2">
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Personagens presentes</span>
          {isLoadingPersonagens ? (
            <LoadingState variant="text" label="Reunindo os personagens do cliente…" />
          ) : erroPersonagens ? (
            <ErrorState onRetry={onReloadPersonagens} description={erroPersonagens} />
          ) : personagens.length === 0 ? (
            <p className="border border-[#4b3823] bg-[#0d0906] p-3 font-serif text-xs text-[#c4b9a3]">
              Nenhum personagem do cliente disponível.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 border border-[#4b3823] bg-[#0d0906] p-2">
              {personagens.map((personagem) => (
                <label key={personagem.id} className="flex cursor-pointer items-center gap-2 font-serif text-xs text-[#c4b9a3]">
                  <input type="checkbox" checked={form.personagens.includes(personagem.nome)} onChange={() => onToggleCharacter(personagem.nome)} className="accent-[#b89558]" />
                  <span>{personagem.nome}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#3a2c1d] pt-4">
        <div className="mb-3 flex gap-2" role="group" aria-label="Modo de publicação">
          <button type="button" onClick={() => onPublishModeChange('now')} className={`flex flex-1 items-center justify-center gap-2 border px-3 py-2 font-cinzel text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#d1a85a] ${publishMode === 'now' ? 'border-[#b89558] bg-[#2a1d10] text-[#f0d79b]' : 'border-[#4b3823] bg-[#0d0906] text-[#8d7557]'}`}><Send className="h-3.5 w-3.5" /> Publicar agora</button>
          <button type="button" onClick={() => onPublishModeChange('schedule')} className={`flex flex-1 items-center justify-center gap-2 border px-3 py-2 font-cinzel text-[10px] uppercase tracking-wider transition-colors focus:outline-none focus:ring-1 focus:ring-[#d1a85a] ${publishMode === 'schedule' ? 'border-[#b89558] bg-[#2a1d10] text-[#f0d79b]' : 'border-[#4b3823] bg-[#0d0906] text-[#8d7557]'}`}><Clock3 className="h-3.5 w-3.5" /> Agendar</button>
        </div>
        {publishMode === 'schedule' && (
          <label className="block space-y-1.5">
            <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Data e hora da publicação</span>
            <input required type="datetime-local" value={form.agendadaPara} onChange={(event) => onFormChange('agendadaPara', event.target.value)} className={inputClassName} />
          </label>
        )}
      </div>

      {saveError && <p role="alert" className="border border-[#7f3d2d] bg-[#2a110d] px-3 py-2 font-serif text-sm text-[#f0b09b]">{saveError}</p>}
      <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#3a2c1d] pt-4 sm:flex-row">
        <button type="button" onClick={onClose} disabled={isSaving} className="border border-[#4b3823] bg-[#120d09] px-4 py-2 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]">Cancelar</button>
        <GothicButton type="submit" size="sm" width={190} height={38} disabled={isSaving} icon={publishMode === 'now' ? <Send className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}>
          {isSaving ? (publishMode === 'now' ? 'Publicando…' : 'Agendando…') : (publishMode === 'now' ? 'Publicar Crônica' : 'Agendar Crônica')}
        </GothicButton>
      </div>
    </form>
  </Modal>
);

export default NovaCronicaModal;
