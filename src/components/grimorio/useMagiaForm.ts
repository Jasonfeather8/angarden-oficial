import { useState } from 'react';
import {
  getSchoolVolumes,
  grimorioAllSchools,
  grimorioElementos,
  grimorioMentalizacao,
  grimorioVolumes,
  type GrimorioLevel,
  type GrimorioSchool,
  type GrimorioSpell,
  type GrimorioVolume,
} from '../../mocks/grimorio';
import { atualizarMagia, criarMagia } from '../../services/grimorioService';
import { enviarImagem } from '../../services/mediaService';
import { livroVolumeDoTomo, resolveDestinationSchool, type BookVolume } from './formatters';

export interface NewSpellForm {
  name: string;
  level: GrimorioLevel | '';
  description: string;
  difficulty: string;
  damage: string;
  duration: string;
  range: string;
  magicalEffects: string;
  consumption: string;
  type: string;
  channeling: string;
  condition: string;
  schoolId: string;
  subcategory: string;
  image: string;
  bookVolume: BookVolume | '';
}

export const initialNewSpellForm: NewSpellForm = {
  name: '', level: '', description: '', difficulty: '', damage: '', duration: '', range: '', magicalEffects: '',
  consumption: '', type: '', channeling: '', condition: '', schoolId: '', subcategory: '', image: '', bookVolume: '',
};

interface UseMagiaFormOptions {
  canManageCatalog: boolean;
  school: GrimorioSchool;
  selectedVolume: GrimorioVolume;
  /** Abre o tomo de destino depois de inscrever ou salvar a magia. */
  abrirTomo: (destino: { schoolId: string; branch: string; volumeId: string }) => void;
  /** Fecha a tela de detalhes antes de abrir o formulário de edição. */
  fecharDetalhes: () => void;
  executarMutacaoGrimorio: (acao: () => Promise<void>) => Promise<void>;
}

/**
 * Estado e validação do formulário de magia: inscrição de uma fórmula nova,
 * edição de um registro existente e o envio da imagem do catálogo.
 */
export function useMagiaForm({
  canManageCatalog,
  school,
  selectedVolume,
  abrirTomo,
  fecharDetalhes,
  executarMutacaoGrimorio,
}: UseMagiaFormOptions) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newSpellForm, setNewSpellForm] = useState<NewSpellForm>(initialNewSpellForm);
  const [editingSpell, setEditingSpell] = useState<GrimorioSpell | null>(null);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [erroUploadImagem, setErroUploadImagem] = useState<string | null>(null);

  const isEditing = editingSpell !== null;

  const formSchool = grimorioAllSchools.find((item) => item.id === newSpellForm.schoolId);
  const formSubcategoryCatalog = formSchool?.id === 'elementar' ? grimorioElementos : formSchool?.id === 'mentalizacao' ? grimorioMentalizacao : [];
  const formDestinationSchool = resolveDestinationSchool(newSpellForm.schoolId, newSpellForm.subcategory) ?? formSchool ?? school;
  const formVolumes = getSchoolVolumes(formDestinationSchool.id);
  const formVolume = newSpellForm.bookVolume
    ? formVolumes[newSpellForm.bookVolume - 1]
    : formVolumes.find((volume) => volume.id === selectedVolume.id) ?? formVolumes[0];

  const abrirCriacao = () => setIsCreateOpen(true);

  const fecharFormulario = () => {
    setIsCreateOpen(false);
    setEditingSpell(null);
    setNewSpellForm(initialNewSpellForm);
  };

  const abrirEdicao = (spell: GrimorioSpell) => {
    if (!canManageCatalog) return;
    const spellVolume = grimorioVolumes.find((volume) => volume.id === spell.volumeId);
    const spellElement = grimorioElementos.find((item) => item.id === spell.schoolId);
    const spellMentalizacaoSubcategory = grimorioMentalizacao.find((item) => item.id === spell.schoolId);
    const hasCustomBookVolume = Object.prototype.hasOwnProperty.call(spell, 'bookVolume');
    const bookVolume = hasCustomBookVolume ? (spell.bookVolume ?? '') : livroVolumeDoTomo(spellVolume);
    const formSchoolId = spellMentalizacaoSubcategory ? 'mentalizacao' : spellElement ? 'elementar' : spell.schoolId;
    const formSubcategory = spell.subcategory ?? spellMentalizacaoSubcategory?.name ?? spellElement?.name ?? '';
    fecharDetalhes();
    setEditingSpell(spell);
    setNewSpellForm({
      name: spell.name,
      level: spell.level,
      description: spell.description,
      difficulty: spell.difficulty,
      damage: spell.damage,
      duration: spell.duration,
      range: spell.range,
      magicalEffects: spell.magicalEffects,
      consumption: spell.consumption,
      type: spell.type,
      channeling: spell.channeling,
      condition: spell.condition,
      schoolId: formSchoolId || '',
      subcategory: formSubcategory,
      image: spell.image ?? '',
      bookVolume,
    });
    setIsCreateOpen(true);
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErroUploadImagem('Selecione um arquivo de imagem válido.');
      return;
    }

    setErroUploadImagem(null);
    setEnviandoImagem(true);
    try {
      const url = await enviarImagem(file, 'grimorio', { maxWidth: 600, maxHeight: 600, quality: 0.82 });
      setNewSpellForm((current) => ({ ...current, image: url }));
    } catch (error) {
      setErroUploadImagem(error instanceof Error ? error.message : 'Não foi possível enviar a imagem.');
    } finally {
      setEnviandoImagem(false);
    }
  };

  const handleSpellSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enviandoImagem) return;
    const destinationSchool = resolveDestinationSchool(newSpellForm.schoolId, newSpellForm.subcategory) ?? formSchool ?? school;
    const destinationVolumes = getSchoolVolumes(destinationSchool.id);
    const destinationVolume = newSpellForm.bookVolume
      ? destinationVolumes[newSpellForm.bookVolume - 1]
      : destinationVolumes.find((volume) => volume.id === selectedVolume.id) ?? destinationVolumes[0];

    if (editingSpell) {
      if (!canManageCatalog) return;
      const spell = editingSpell;
      const editedSpell: GrimorioSpell = {
        ...spell,
        schoolId: destinationSchool.id,
        volumeId: destinationVolume.id,
        name: newSpellForm.name.trim(),
        level: newSpellForm.level,
        description: newSpellForm.description,
        difficulty: newSpellForm.difficulty,
        damage: newSpellForm.damage,
        duration: newSpellForm.duration,
        range: newSpellForm.range,
        magicalEffects: newSpellForm.magicalEffects,
        consumption: newSpellForm.consumption,
        type: newSpellForm.type,
        channeling: newSpellForm.channeling,
        condition: newSpellForm.condition,
        subcategory: newSpellForm.subcategory || undefined,
        image: newSpellForm.image || spell.image || undefined,
        bookVolume: newSpellForm.bookVolume || undefined,
      };
      void executarMutacaoGrimorio(() => atualizarMagia(editedSpell));
      setEditingSpell(null);
      setNewSpellForm(initialNewSpellForm);
      setIsCreateOpen(false);
      abrirTomo({ schoolId: destinationSchool.id, branch: newSpellForm.subcategory, volumeId: destinationVolume.id });
      return;
    }

    if (!canManageCatalog) return;
    const id = `custom-spell-${Date.now()}`;
    const newSpell: GrimorioSpell = {
      id,
      schoolId: destinationSchool.id,
      volumeId: destinationVolume.id,
      name: newSpellForm.name.trim(),
      level: newSpellForm.level,
      description: newSpellForm.description,
      difficulty: newSpellForm.difficulty,
      damage: newSpellForm.damage,
      duration: newSpellForm.duration,
      range: newSpellForm.range,
      magicalEffects: newSpellForm.magicalEffects,
      consumption: newSpellForm.consumption,
      type: newSpellForm.type,
      channeling: newSpellForm.channeling,
      condition: newSpellForm.condition,
      visual: destinationSchool.id === 'elementar' ? 'fire' : 'earth',
      subcategory: newSpellForm.subcategory || undefined,
      image: newSpellForm.image || undefined,
      bookVolume: newSpellForm.bookVolume || undefined,
    };
    void executarMutacaoGrimorio(() => criarMagia(newSpell));
    setNewSpellForm(initialNewSpellForm);
    setIsCreateOpen(false);
    abrirTomo({ schoolId: destinationSchool.id, branch: newSpellForm.subcategory, volumeId: destinationVolume.id });
  };

  return {
    isCreateOpen,
    isEditing,
    newSpellForm,
    setNewSpellForm,
    enviandoImagem,
    erroUploadImagem,
    formSchool,
    formSubcategoryCatalog,
    formDestinationSchool,
    formVolume,
    abrirCriacao,
    abrirEdicao,
    fecharFormulario,
    handleImageChange,
    handleSpellSubmit,
  };
}
