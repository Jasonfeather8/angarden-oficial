import { useEffect, useState } from 'react';
import {
  getSchoolVolumes,
  grimorioAllSchools,
  grimorioElementos,
  grimorioMentalizacao,
  grimorioSchools,
  grimorioVolumes,
} from '../../mocks/grimorio';
import { ESCOLA_INICIAL_DO_GRIMORIO } from '../../services/grimorioQuery';

/** Telas do Grimório: círculo de escolas, árvores de navegação e livro aberto. */
export type View = 'schools' | 'element-tree' | 'mental-tree' | 'tree' | 'book';

interface UseNavegacaoDoGrimorioOptions {
  escolaBloqueada: (schoolId: string) => boolean;
  volumeBloqueado: (volumeId: string) => boolean;
  /** Mestre e Administrador enxergam o conteúdo selado. */
  podeVerBloqueado: boolean;
}

/**
 * Onde o leitor está: escola, ramo, tomo e fólio abertos, com a trilha de
 * navegação e os avisos de conteúdo selado pelo Mestre.
 */
export function useNavegacaoDoGrimorio({
  escolaBloqueada,
  volumeBloqueado,
  podeVerBloqueado,
}: UseNavegacaoDoGrimorioOptions) {
  const [view, setView] = useState<View>('schools');
  const [bloqueioAviso, setBloqueioAviso] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState(ESCOLA_INICIAL_DO_GRIMORIO);
  const [branch, setBranch] = useState('');
  const [volumeId, setVolumeId] = useState('');
  const [folioPage, setFolioPage] = useState(1);

  const school = grimorioAllSchools.find((item) => item.id === schoolId) ?? grimorioSchools[0];
  const volumes = getSchoolVolumes(school.id);
  const selectedVolume = volumes.find((volume) => volume.id === volumeId) ?? volumes[0];

  useEffect(() => {
    setFolioPage(1);
  }, [schoolId, selectedVolume?.id]);

  const irParaPrimeiroFolio = () => setFolioPage(1);
  const irParaFolio = (pagina: number) => setFolioPage(pagina);

  // Escolas seladas das árvores de elementos e de mentalização.
  const elementosBloqueados = grimorioElementos.filter((item) => escolaBloqueada(item.id)).map((item) => item.id);
  const mentalizacoesBloqueadas = grimorioMentalizacao.filter((item) => escolaBloqueada(item.id)).map((item) => item.id);

  const chooseSchool = (id: string, chosenBranch = '') => {
    if (escolaBloqueada(id) && !podeVerBloqueado) {
      const target = grimorioAllSchools.find((item) => item.id === id);
      setBloqueioAviso(`O Mestre selou a escola ${target?.name ?? id}.`);
      return;
    }
    setBloqueioAviso(null);
    setSchoolId(id);
    setBranch(chosenBranch);
    setVolumeId('');
    setFolioPage(1);
    setView(id === 'elementar' ? 'element-tree' : id === 'mentalizacao' ? 'mental-tree' : 'tree');
  };

  const chooseElement = (id: string) => {
    const element = grimorioElementos.find((item) => item.id === id);
    if (!element) return;
    if (escolaBloqueada(id) && !podeVerBloqueado) {
      setBloqueioAviso(`O Mestre selou a escola ${element.name}.`);
      return;
    }
    setBloqueioAviso(null);
    setSchoolId(element.id);
    setBranch(element.subtitle);
    setVolumeId('');
    setFolioPage(1);
    setView('tree');
  };

  const chooseMentalizacaoSubcategory = (id: string) => {
    const subcategory = grimorioMentalizacao.find((item) => item.id === id);
    if (!subcategory) return;
    if (escolaBloqueada(id) && !podeVerBloqueado) {
      setBloqueioAviso(`O Mestre selou a escola ${subcategory.name}.`);
      return;
    }
    setBloqueioAviso(null);
    setSchoolId(subcategory.id);
    setBranch(subcategory.subtitle);
    setVolumeId('');
    setFolioPage(1);
    setView('tree');
  };

  const chooseVolume = (id: string) => {
    const volume = grimorioVolumes.find((item) => item.id === id);
    const bloqueado = volumeBloqueado(id) || escolaBloqueada(school.id);
    if (bloqueado && !podeVerBloqueado) {
      setBloqueioAviso(`O Mestre selou o tomo ${volume?.title ?? id} ou sua escola.`);
      return;
    }
    setBloqueioAviso(null);
    setVolumeId(id);
    setFolioPage(1);
    setView('book');
  };

  const goBack = () => {
    if (view === 'book') setView('tree');
    else if (view === 'tree') {
      if (grimorioElementos.some((item) => item.id === schoolId)) {
        setSchoolId('elementar');
        setBranch('');
        setVolumeId('');
        setView('element-tree');
      } else if (grimorioMentalizacao.some((item) => item.id === schoolId)) {
        setSchoolId('mentalizacao');
        setBranch('');
        setVolumeId('');
        setView('mental-tree');
      } else {
        setView('schools');
      }
    } else if (view === 'element-tree' || view === 'mental-tree') setView('schools');
  };

  /** Abre diretamente o tomo de destino de uma magia inscrita ou editada. */
  const abrirTomo = (destino: { schoolId: string; branch: string; volumeId: string }) => {
    setSchoolId(destino.schoolId);
    setBranch(destino.branch);
    setVolumeId(destino.volumeId);
    setFolioPage(1);
    setView('book');
  };

  return {
    view,
    schoolId,
    branch,
    volumeId,
    folioPage,
    bloqueioAviso,
    school,
    volumes,
    selectedVolume,
    elementosBloqueados,
    mentalizacoesBloqueadas,
    irParaPrimeiroFolio,
    irParaFolio,
    chooseSchool,
    chooseElement,
    chooseMentalizacaoSubcategory,
    chooseVolume,
    goBack,
    abrirTomo,
  };
}
