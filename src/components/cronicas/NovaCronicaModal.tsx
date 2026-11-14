import React, { useEffect, useState } from 'react';
import { Clock3, Gift, ImagePlus, ListChecks, ScrollText, Send, Users } from 'lucide-react';
import { clsx } from 'clsx';
import type { CategoriaCronica, Cronica } from '@/types';
import { useAuthorization } from '@/hooks/useAuthorization';
import { ChecklistDaCronicaPanel } from './ChecklistDaCronicaPanel';
import { ParticipantesDaCronicaPanel } from './ParticipantesDaCronicaPanel';
import { RecompensasDaCronicaPanel } from './RecompensasDaCronicaPanel';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';
import type { CampoDoFormulario, ModoDePublicacao, NovaCronicaForm } from './useCronicaForm';

const inputClassName =
  'w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2.5 text-sm text-[#e6ddc5] outline-none transition-colors placeholder:text-[#6f5c47] focus:border-[#b89558] focus:ring-1 focus:ring-[#b89558]/50';

const rotuloClassName = 'font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]';

type Aba = 'relato' | 'checklist' | 'recompensas' | 'companhia';

const abas: Array<{ id: Aba; titulo: string; Icon: typeof ScrollText }> = [
  { id: 'relato', titulo: 'Relato', Icon: ScrollText },
  { id: 'checklist', titulo: 'Checklist', Icon: ListChecks },
  { id: 'recompensas', titulo: 'Recompensas', Icon: Gift },
  { id: 'companhia', titulo: 'Companhia', Icon: Users },
];

export interface NovaCronicaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  form: NovaCronicaForm;
  onFormChange: (field: CampoDoFormulario, value: string) => void;
  onCategoriaChange: (value: string) => void;
  onNotasVisiveisChange: (value: boolean) => void;
  categorias: CategoriaCronica[];
  editando: boolean;
  cronica: Cronica | null;
  recemCriada: boolean;
  concluida: boolean;
  onCoverChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  publishMode: ModoDePublicacao;
  onPublishModeChange: (modo: ModoDePublicacao) => void;
  isSaving: boolean;
  saveError: string | null;
  onCronicaAlterada: () => void;
}

/** Modal de relato e montagem do checklist, recompensas e companhia. */
export const NovaCronicaModal: React.FC<NovaCronicaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  form,
  onFormChange,
  onCategoriaChange,
  onNotasVisiveisChange,
  categorias,
  editando,
  cronica,
  recemCriada,
  concluida,
  onCoverChange,
  publishMode,
  onPublishModeChange,
  isSaving,
  saveError,
  onCronicaAlterada,
}) => {
  const { userId } = useAuthorization();
  const [aba, setAba] = useState<Aba>('relato');
  const [erroDeAba, setErroDeAba] = useState('');
  const permiteAgendar = !editando || !concluida;

  // Ao abrir, a aba volta ao relato; logo depois de criar, o modal leva o Mestre
  // direto ao checklist, que é o próximo passo da montagem.
  useEffect(() => {
    if (!isOpen) return;
    setAba(recemCriada ? 'checklist' : 'relato');
    setErroDeAba('');
  }, [isOpen, recemCriada]);

  const enviar = (event: React.FormEvent<HTMLFormElement>) => {
    // Ignora o envio propagado por um formulário de modal interno.
    if (event.target !== event.currentTarget) return;
    if (!form.titulo.trim() || !form.dataAventura) {
      event.preventDefault();
      setAba('relato');
      setErroDeAba('Informe o título e a data da aventura.');
      return;
    }
    setErroDeAba('');
    onSubmit(event);
  };

  const titulo = recemCriada ? 'Montar Crônica' : editando ? 'Editar Crônica' : 'Nova Crônica';
  const subtitulo = recemCriada
    ? 'Complete os objetivos, as recompensas e a companhia'
    : editando
      ? 'Atualize o relato e os detalhes da sessão'
      : 'Redija e publique o próximo capítulo da crônica';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titulo}
      subtitle={subtitulo}
      maxWidth="max-w-[900px]"
    >
      <form onSubmit={enviar} className="space-y-5">
        <div role="tablist" aria-label="Seções da crônica" className="flex flex-wrap gap-2">
          {abas.map(({ id, titulo: rotulo, Icon }) => {
            const ativa = aba === id;
            const desabilitada = id !== 'relato' && !cronica;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={ativa}
                aria-controls={`cronica-tabpanel-${id}`}
                disabled={desabilitada}
                title={desabilitada ? 'Salve a crônica antes de abrir esta seção.' : undefined}
                onClick={() => {
                  setAba(id);
                  setErroDeAba('');
                }}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-sm border px-3 py-1.5 font-cinzel text-[10px] uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1a85a] disabled:cursor-not-allowed disabled:opacity-50',
                  ativa
                    ? 'border-[#b89558] bg-[#2a1d10] text-[#f0d79b]'
                    : 'border-[#4b3823] bg-[#120d09] text-[#a88d61] hover:border-[#8c6b41]',
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {rotulo}
              </button>
            );
          })}
        </div>

        {recemCriada && (
          <p className="border border-[#5a4225] bg-[#1b120b] px-3 py-2 font-serif text-sm text-[#c6a66d]">
            Crônica criada. Monte agora o checklist, as recompensas e a companhia.
          </p>
        )}

        {aba === 'relato' ? (
          <div id="cronica-tabpanel-relato" role="tabpanel" aria-label="Relato" className="space-y-5">
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
          </div>
        ) : cronica ? (
          <div id={`cronica-tabpanel-${aba}`} role="tabpanel" aria-label={abas.find((item) => item.id === aba)?.titulo}>
            {aba === 'checklist' && (
              <ChecklistDaCronicaPanel cronica={cronica} podeGerir onCronicaAlterada={onCronicaAlterada} />
            )}
            {aba === 'recompensas' && (
              <RecompensasDaCronicaPanel cronica={cronica} podeGerir onCronicaAlterada={onCronicaAlterada} />
            )}
            {aba === 'companhia' && (
              <ParticipantesDaCronicaPanel
                cronica={cronica}
                podeGerir
                userId={userId}
                onAlterados={onCronicaAlterada}
              />
            )}
          </div>
        ) : null}

        {(erroDeAba || saveError) && (
          <p role="alert" className="border border-[#7f3d2d] bg-[#2a110d] px-3 py-2 font-serif text-sm text-[#f0b09b]">
            {erroDeAba || saveError}
          </p>
        )}

        <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#3a2c1d] pt-4 sm:flex-row">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="border border-[#4b3823] bg-[#120d09] px-4 py-2 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus:outline-none focus:ring-1 focus:ring-[#d1a85a]"
          >
            {recemCriada ? 'Fechar' : 'Cancelar'}
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
