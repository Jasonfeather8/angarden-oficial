import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { cronicaService } from '@/services/cronicaService';
import { enviarImagem } from '@/services/mediaService';
import type { Cronica, NovaCronica } from '@/types';

/** Campos de texto do formulário, na ordem em que a tela os edita. */
export type CampoDoFormulario =
  | 'titulo'
  | 'dataAventura'
  | 'relato'
  | 'progresso'
  | 'local'
  | 'agendadaPara';

/** Publicar de imediato ou deixar a crônica guardada até a hora marcada. */
export type ModoDePublicacao = 'now' | 'schedule';

export interface NovaCronicaForm {
  titulo: string;
  dataAventura: string;
  relato: string;
  progresso: string;
  local: string;
  agendadaPara: string;
  personagens: string[];
  capaUrl?: string;
}

const formularioInicial: NovaCronicaForm = {
  titulo: '',
  dataAventura: '',
  relato: '',
  progresso: '0',
  local: '',
  agendadaPara: '',
  personagens: [],
  capaUrl: undefined,
};

interface UseCronicaFormOptions {
  /** Chamado depois de gravar, para a tela abrir a crônica recém-criada. */
  onCriada: (cronica: Cronica) => void;
}

/**
 * Estado do formulário de nova crônica: abertura do modal, campos, capa,
 * modo de publicação e o envio ao serviço, com o upload da imagem de capa.
 */
export function useCronicaForm({ onCriada }: UseCronicaFormOptions) {
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [publishMode, setPublishMode] = useState<ModoDePublicacao>('now');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [arquivoCapa, setArquivoCapa] = useState<File | null>(null);
  const [form, setForm] = useState<NovaCronicaForm>(formularioInicial);

  const abrirCriacao = () => setCreateModalOpen(true);

  const resetForm = () => {
    if (arquivoCapa && form.capaUrl) URL.revokeObjectURL(form.capaUrl);
    setArquivoCapa(null);
    setForm(formularioInicial);
    setPublishMode('now');
    setSaveError(null);
  };

  const fecharFormulario = () => {
    if (isSaving) return;
    setCreateModalOpen(false);
    resetForm();
  };

  const updateForm = (field: CampoDoFormulario, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleCharacter = (character: string) => {
    setForm((current) => ({
      ...current,
      personagens: current.personagens.includes(character)
        ? current.personagens.filter((item) => item !== character)
        : [...current.personagens, character],
    }));
  };

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
      const dados: NovaCronica = {
        titulo: form.titulo.trim(),
        dataAventura: form.dataAventura,
        relato: form.relato.trim(),
        local: form.local.trim(),
        progresso: Math.min(100, Math.max(0, Number(form.progresso) || 0)),
        personagens: form.personagens,
        status: publishMode === 'schedule' ? 'AGENDADA' : 'PUBLICADA',
        agendadaPara: publishMode === 'schedule' ? new Date(form.agendadaPara).toISOString() : undefined,
        capaUrl: form.capaUrl,
      };

      if (arquivoCapa) {
        const capaUrl = await enviarImagem(arquivoCapa, 'cronicas');
        if (form.capaUrl) URL.revokeObjectURL(form.capaUrl);
        setArquivoCapa(null);
        setForm((current) => ({ ...current, capaUrl }));
        dados.capaUrl = capaUrl;
      }

      const criada = await cronicaService.criar(dados);
      setCreateModalOpen(false);
      resetForm();
      onCriada(criada);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Não foi possível salvar a crônica.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isCreateModalOpen,
    abrirCriacao,
    fecharFormulario,
    form,
    updateForm,
    toggleCharacter,
    handleCoverChange,
    publishMode,
    setPublishMode,
    isSaving,
    saveError,
    handleSubmit,
  };
}
