import {
  grimorioAdditionalSchools,
  grimorioAllSchools,
  grimorioElementos,
  grimorioMentalizacao,
  grimorioSchools,
  type GrimorioSchool,
  type GrimorioVolume,
} from '../../mocks/grimorio';

/** Volume de livro (1, 2, 3) usado pelo formulário de magia. */
export type BookVolume = 1 | 2 | 3;

/** Escolas disponíveis no seletor do formulário de magia. */
export const grimorioFormSchools: GrimorioSchool[] = [...grimorioSchools, ...grimorioAdditionalSchools];

/** Tamanho em megabytes, com uma casa decimal. */
export const formatarMegabytes = (bytes: number) => (bytes / 1048576).toFixed(1);

/** Pluralização do contador de magias dos resultados da busca. */
export const pluralizarMagias = (total: number) => (total === 1 ? 'magia' : 'magias');

/** Volume de livro declarado no tomo (I, II, III) ou '' quando não corresponde a nenhum. */
export const livroVolumeDoTomo = (tomo: GrimorioVolume | undefined): BookVolume | '' =>
  tomo?.number === 'I' ? 1 : tomo?.number === 'II' ? 2 : tomo?.number === 'III' ? 3 : '';

/**
 * Escola de destino de uma magia. Quando a escola escolhida é um "guarda-chuva"
 * (elementar ou mentalização), a subcategoria define o destino real.
 */
export const resolveDestinationSchool = (
  selectedSchoolId: string,
  subcategory: string,
): GrimorioSchool | undefined => {
  const selectedSchool = grimorioAllSchools.find((item) => item.id === selectedSchoolId);
  if (!selectedSchool || (selectedSchool.id !== 'elementar' && selectedSchool.id !== 'mentalizacao')) return selectedSchool;

  const normalizedSubcategory = subcategory.trim().toLowerCase();
  const subcategories = selectedSchool.id === 'elementar' ? grimorioElementos : grimorioMentalizacao;
  return subcategories.find((item) =>
    item.name.toLowerCase() === normalizedSubcategory || item.subtitle.toLowerCase() === normalizedSubcategory,
  ) ?? selectedSchool;
};
