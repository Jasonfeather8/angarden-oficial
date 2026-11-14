import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { cronicaService } from '@/services/cronicaService';
import { enviarImagem } from '@/services/mediaService';
import type { Cronica, NovaCronica } from '@/types';

export type CampoDoFormulario =
  | 'titulo'
  | 'dataAventura'
  | 'relato'
  | 'local'
  | 'agendadaPara';

export type ModoDePublicacao = 'now' | 'schedule';

export interface NovaCronicaForm {
  titulo: string;
  dataAventura: string;
  relato: string;
  local: string;
  agendadaPara: string;
  capaUrl?: string;
  categoriaId: string;
  notasVisiveis: boolean;
}

const formularioInicial: NovaCronicaForm = {
  titulo: '',
  dataAventura: '',
  relato: '',
  local: '',
  agendadaPara: '',
  capaUrl: undefined,
  categoriaId: '',
  notasVisiveis: false,
};

function formularioDe(cronica: Cronica): NovaCronicaForm {
  return {
    titulo: cronica.titulo,
    dataAventura: cronica.dataAventura,
    relato: cronica.relato,
    local: cronica.local,
    agendadaPara: cronica.agendadaPara
      ? new Date(cronica.agendadaPara).toISOString().slice(0, 16)
      : '',
    capaUrl: cronica.capaUrl,
    categoriaId: cronica.categoriaId ?? '',
    notasVisiveis: cronica.notasVisiveis,
  };
}

interface UseCronicaFormOptions {
  /** Chamado depois de criar ou editar, com a crônica gravada. */
  onSalva: (cronica: Cronica) => void;
}

/**
 * Formulário de crônica em criação e em edição. A presença dos personagens não
 * é mais escolhida aqui: a companhia vem das inscrições da crônica.
 */
export function useCronicaForm({ onSalva }: UseCronicaFormOptions) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [cronicaEmEdicao, setCronicaEmEdicao] = useState<Cronica | null>(null);
  const [recemCriada, setRecemCriada] = useState(false);
  const [publishMode, setPublishMode] = useState<ModoDePublicacao>('now');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);
  const [form, setForm] = useState<NovaCronicaForm>(formularioInicial);

  const resetForm = () => {
    if (arquivoCapa && form.capaUrl) URL.revokeObjectURL(form.capaUrl);
    setArquivoCapa(null);
    setForm(formularioInicial);
    setPublishMode('now');
    setCronicaEmEdicao(null);
    setRecemCriada(false);
    setSaveError(null);
  };

  const abrirCriacao = () => {
    resetForm();
    setCreateModalOpen(true);
  };

  const abrirEdicao = (cronica: Cronica) => {
    resetForm();
    setCronicaEmEdicao(cronica);
    setForm(formularioDe(cronica));
    setPublishMode(cronica.status === 'AGENDADA' ? 'schedule' : 'now');
    setCreateModalOpen(true);
  };

  const fecharFormulario = () => {
    if (isSaving) return;
    setCreateModalOpen(false);
    resetForm();
  };

  const updateForm = (field: CampoDoFormulario, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setCategoriaId = (categoriaId: string) =>
    setForm((current) => ({ ...current, categoriaId }));

  const setNotasVisiveis = (notasVisiveis: boolean) =>
    setForm((current) => ({ ...current, notasVisiveis }));

  const handleCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (arquivoCapa && form.capaUrl) URL.revokeObjectURL(form.capaUrl);
    setArquivoCapa(file);
    setForm((current) => ({ ...current, capaUrl: URL.createObjectURL(file) }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    try {
      const editando = cronicaEmEdicao;
      const dados: NovaCronica = {
        titulo: form.titulo.trim(),
        dataAventura: form.dataAventura,
        relato: form.relato.trim(),
        local: form.local.trim(),
        progresso: 0,
        // O legado `personagens` é preservado; a companhia viva está nas inscrições.
        personagens: editando?.personagens ?? [],
        status: editando?.status === 'CONCLUIDA'
          ? 'CONCLUIDA'
          : publishMode === 'schedule'
            ? 'AGENDADA'
            : 'PUBLICADA',
        agendadaPara: publishMode === 'schedule' ? new Date(form.agendadaPara).toISOString() : undefined,
        capaUrl: form.capaUrl,
        categoriaId: form.categoriaId || undefined,
        notasVisiveis: form.notasVisiveis,
      };

      if (arquivoCapa) {
        const capaUrl = await enviarImagem(arquivoCapa, 'cronicas');
        if (form.capaUrl) URL.revokeObjectURL(form.capaUrl);
        setArquivoCapa(null);
        dados.capaUrl = capaUrl;
      }

      if (editando) {
        const salva = await cronicaService.atualizar(editando.id, dados, false);
        setCreateModalOpen(false);
        resetForm();
        onSalva(salva);
      } else {
        // Após criar, o mesmo modal segue aberto para montar checklist e companhia.
        const salva = await cronicaService.criar(dados);
        setCronicaEmEdicao(salva);
        setForm(formularioDe(salva));
        setRecemCriada(true);
        setPublishMode('now');
        onSalva(salva);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Não foi possível salvar a crônica.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isCreateModalOpen,
    cronicaEmEdicao,
    recemCriada,
    abrirCriacao,
    abrirEdicao,
    fecharFormulario,
    form,
    updateForm,
    setCategoriaId,
    setNotasVisiveis,
    handleCoverChange,
    publishMode,
    setPublishMode,
    isSaving,
    saveError,
    handleSubmit,
  };
}
