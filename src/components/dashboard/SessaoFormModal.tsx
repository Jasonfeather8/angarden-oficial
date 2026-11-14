import React from 'react';
import type { FormEvent } from 'react';
import { CalendarClock, Link2 } from 'lucide-react';
import { GothicButton } from '../GothicButton';
import { Modal } from '../Modal';
import { toDatetimeLocal } from './formatters';
import type { SessionForm, SessionFormMode } from './useSessaoForm';

const fieldClassName =
  'w-full border border-[#4b3823] bg-[#0d0906] px-3 py-2.5 text-sm text-[#e6ddc5] outline-none transition-colors focus:border-[#b89558] focus:ring-1 focus:ring-[#b89558]/50';

export interface SessaoFormModalProps {
  isOpen: boolean;
  modo: SessionFormMode;
  isSaving: boolean;
  form: SessionForm;
  erro: string;
  onClose: () => void;
  onChange: (field: keyof SessionForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

/** Modal de agendamento/edição da sessão da mesa. */
export const SessaoFormModal: React.FC<SessaoFormModalProps> = ({
  isOpen,
  modo,
  isSaving,
  form,
  erro,
  onClose,
  onChange,
  onSubmit,
}) => {
  const modoEdicao = modo === 'editar';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      title={modoEdicao ? 'Editar Sessão' : 'Agendar Nova Sessão'}
      subtitle={modoEdicao ? 'Ajuste a data, a pauta ou a sala virtual' : 'Convide a companhia para o próximo capítulo'}
      maxWidth="max-w-[680px]"
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5">
            <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Data e Hora</span>
            <input
              required
              type="datetime-local"
              value={form.dataHora}
              min={toDatetimeLocal(new Date(Date.now() + 60000))}
              onChange={(event) => onChange('dataHora', event.target.value)}
              className={fieldClassName}
              aria-describedby="schedule-form-error"
            />
          </label>
          <label className="space-y-1.5">
            <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Título da Sessão</span>
            <input
              required
              type="text"
              value={form.titulo}
              onChange={(event) => onChange('titulo', event.target.value)}
              className={fieldClassName}
              aria-describedby="schedule-form-error"
            />
          </label>
        </div>

        <label className="block space-y-1.5">
          <span className="font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]">Pauta / Preparação</span>
          <textarea
            required
            value={form.pauta}
            onChange={(event) => onChange('pauta', event.target.value)}
            className={`${fieldClassName} min-h-[120px] resize-y`}
            aria-describedby="schedule-form-error"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 font-cinzel text-[10px] font-bold uppercase tracking-wider text-[#c9aa68]"><Link2 className="h-3.5 w-3.5" aria-hidden="true" /> Link do Servidor de Voz / VTT (opcional)</span>
          <input
            type="url"
            value={form.linkVtt}
            onChange={(event) => onChange('linkVtt', event.target.value)}
            className={fieldClassName}
            aria-describedby="schedule-form-error"
          />
        </label>

        {erro && <p id="schedule-form-error" role="alert" className="border border-[#7f3d2d] bg-[#2a110d] px-3 py-2 font-serif text-sm text-[#f0b09b]">{erro}</p>}

        <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#3a2c1d] pt-4 sm:flex-row">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="border border-[#4b3823] bg-[#120d09] px-4 py-2 font-cinzel text-[10px] uppercase tracking-wider text-[#a88d61] transition-colors hover:border-[#8c6b41] hover:text-[#e6ddc5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f0c265] disabled:opacity-50"
          >
            Cancelar
          </button>
          <GothicButton
            type="submit"
            size="sm"
            width={190}
            height={38}
            disabled={isSaving}
            icon={<CalendarClock className="h-4 w-4" aria-hidden="true" />}
            className="max-w-full focus-visible:ring-2 focus-visible:ring-[#f0c265]"
          >
            {isSaving ? 'Salvando...' : modoEdicao ? 'Salvar Alterações' : 'Agendar Sessão'}
          </GothicButton>
        </div>
      </form>
    </Modal>
  );
};

export default SessaoFormModal;
