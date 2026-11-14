import { useState } from 'react';
import type { FormEvent } from 'react';
import { scheduleService } from '../../services/scheduleService';
import type { SessaoDaMesa } from '../../types';
import { isHttpUrl, toDatetimeLocal } from './formatters';

export type SessionFormMode = 'agendar' | 'editar';

export interface SessionForm {
  dataHora: string;
  titulo: string;
  pauta: string;
  linkVtt: string;
}

const FORM_VAZIO: SessionForm = { dataHora: '', titulo: '', pauta: '', linkVtt: '' };

/**
 * Máquina de estado do formulário de sessão: abrir em modo agendar ou editar,
 * validar e gravar. `onSaved` revalida a próxima sessão depois de salvar.
 */
export function useSessaoForm(sessao: SessaoDaMesa | null, onSaved: () => void) {
  const [isOpen, setOpen] = useState(false);
  const [modo, setModo] = useState<SessionFormMode>('agendar');
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<SessionForm>(FORM_VAZIO);
  const [erro, setErro] = useState('');

  const abrirAgendamento = () => {
    setModo('agendar');
    setForm(FORM_VAZIO);
    setErro('');
    setOpen(true);
  };

  const abrirEdicao = () => {
    if (!sessao) return;
    setModo('editar');
    setForm({
      dataHora: toDatetimeLocal(new Date(sessao.dataHora)),
      titulo: sessao.titulo,
      pauta: sessao.pauta,
      linkVtt: sessao.linkVtt ?? '',
    });
    setErro('');
    setOpen(true);
  };

  const fechar = () => {
    setOpen(false);
    setErro('');
  };

  const atualizarCampo = (field: keyof SessionForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErro('');
  };

  const salvar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    const title = form.titulo.trim();
    const agenda = form.pauta.trim();
    const scheduledDate = Date.parse(form.dataHora);

    if (!form.dataHora || !title || !agenda) {
      setErro('Preencha a data e hora, o título e a pauta da sessão.');
      return;
    }
    if (!Number.isFinite(scheduledDate) || scheduledDate <= Date.now()) {
      setErro('A sessão deve ser agendada para uma data e hora futuras.');
      return;
    }
    if (form.linkVtt.trim() && !isHttpUrl(form.linkVtt.trim())) {
      setErro('Informe um link válido começando com http:// ou https://.');
      return;
    }

    setIsSaving(true);
    try {
      await scheduleService.salvarSessao(
        {
          dataHora: new Date(form.dataHora).toISOString(),
          titulo: title,
          pauta: agenda,
          linkVtt: form.linkVtt.trim() || undefined,
        },
        modo === 'editar' ? sessao?.id : undefined
      );
      onSaved();
      fechar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível agendar a sessão.');
    } finally {
      setIsSaving(false);
    }
  };

  return { isOpen, modo, isSaving, form, erro, abrirAgendamento, abrirEdicao, fechar, atualizarCampo, salvar };
}
