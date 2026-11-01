export const GRIMORIO_LEVELS = [
  'Simples',
  'Intermédia',
  'Superior',
  'Mestre',
  'Arcana',
  'Etérea Arcana',
  'Grão Arcano',
  'Divina',
] as const;

export type GrimorioLevel = (typeof GRIMORIO_LEVELS)[number];

export interface GrimorioSchool {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  accent: string;
  branches?: string[];
}

export interface GrimorioVolume {
  id: string;
  schoolId: string;
  title: string;
  subtitle: string;
  description: string;
  number: string;
  spellIds: string[];
}

export interface GrimorioSpell {
  id: string;
  schoolId: string;
  volumeId: string;
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
  visual: 'fire' | 'water' | 'wind' | 'earth' | 'ward' | 'summon' | 'mind' | 'restore' | 'death';
  subcategory?: string;
  image?: string;
  bookVolume?: 1 | 2 | 3;
}

export const grimorioSchools: GrimorioSchool[] = [
  {
    id: 'elementar',
    name: 'Elementar',
    subtitle: 'Os elementos do mundo',
    description: 'O domínio primordial de Fogo, Água, Ar e Terra.',
    accent: '#c9784a',
    branches: ['Fogo', 'Água', 'Ar', 'Terra'],
  },
  { id: 'abjuracao', name: 'Abjuração', subtitle: 'Selos e proteções', description: 'Barreiras, pactos e a arte de banir o impossível.', accent: '#8aa7b5' },
  { id: 'conjuracao', name: 'Conjuração', subtitle: 'Chamados do além', description: 'Convoca criaturas, objetos e forças para o círculo.', accent: '#a98ac2' },
  { id: 'materializacao', name: 'Materialização', subtitle: 'A forma obedece', description: 'Forja a matéria com vontade, essência e precisão.', accent: '#c6a15b' },
  { id: 'mentalizacao', name: 'Mentalização', subtitle: 'O pensamento é lâmina', description: 'Dobra sentidos, memórias e as vontades ocultas.', accent: '#819dc8' },
  { id: 'restauracao', name: 'Restauração', subtitle: 'O sopro que renova', description: 'Cura feridas e devolve equilíbrio ao corpo e à alma.', accent: '#8eaf83' },
  { id: 'necromancia', name: 'Necromancia', subtitle: 'O véu entre mundos', description: 'Negocia com a morte e os ecos que ela deixou.', accent: '#a87f96' },
];

export const grimorioElementos: GrimorioSchool[] = [
  { id: 'piromancia', name: 'Piromancia', subtitle: 'Fogo', description: 'A chama primordial e sua vontade indomável.', accent: '#d36b45' },
  { id: 'hidromancia', name: 'Hidromancia', subtitle: 'Água', description: 'O fluxo, a pressão e a memória das águas.', accent: '#5d9fc5' },
  { id: 'geomancia', name: 'Geomancia', subtitle: 'Terra', description: 'A força profunda da pedra e do solo.', accent: '#a77b4d' },
  { id: 'aeromancia', name: 'Aeromancia', subtitle: 'Ar', description: 'O movimento invisível que atravessa o mundo.', accent: '#9bb8b2' },
  { id: 'eletromancia', name: 'Eletromancia', subtitle: 'Eletricidade', description: 'A centelha veloz entre matéria e céu.', accent: '#d9bd5d' },
  { id: 'criromancia', name: 'Criomancia', subtitle: 'Gelo', description: 'O frio que silencia e preserva.', accent: '#8bbbd1' },
  { id: 'magmancia', name: 'Magmancia', subtitle: 'Magma', description: 'O calor líquido guardado no coração da terra.', accent: '#c95e3d' },
  { id: 'arenomancia', name: 'Arenomancia', subtitle: 'Areia', description: 'Grãos antigos moldados pelo tempo e pelo vento.', accent: '#c5a15f' },
  { id: 'metalomancia', name: 'Metalomancia', subtitle: 'Metal', description: 'A dureza e o brilho das ligas forjadas.', accent: '#9b9b9d' },
  { id: 'dinamancia', name: 'Dinamancia', subtitle: 'Combustão', description: 'A transformação súbita de energia e matéria.', accent: '#e28d48' },
  { id: 'atmomancia', name: 'Atmomancia', subtitle: 'Vapor', description: 'A névoa quente que expande e envolve.', accent: '#b8aaa0' },
  { id: 'fitocinese', name: 'Fitomancia', subtitle: 'Plantas', description: 'O crescimento, as raízes e a seiva viva.', accent: '#7fa65f' },
  { id: 'pneumamancia', name: 'Pneumamancia', subtitle: 'Gases', description: 'As substâncias sutis que flutuam e se misturam.', accent: '#a6a9bb' },
  { id: 'nihilmancia', name: 'Nihilmancia', subtitle: 'Vácuo/Vazio', description: 'A ausência que dobra os limites do espaço.', accent: '#827c9f' },
  { id: 'oximancia', name: 'Oximancia', subtitle: 'Ácido', description: 'A corrosão alquímica que dissolve matéria e resistência.', accent: '#a8b85f' },
  { id: 'plasmamancia', name: 'Plasmamancia', subtitle: 'Plasma', description: 'A matéria excitada em seu estado mais radiante.', accent: '#d478c5' },
  { id: 'magnetomancia', name: 'Magnetomancia', subtitle: 'Magnetismo', description: 'A atração e a repulsão das forças ocultas.', accent: '#8b86c0' },
  { id: 'eteromancia', name: 'Eteromancia', subtitle: 'Éter', description: 'O meio arcano que conecta todas as coisas.', accent: '#bd9ad2' },
];

export const grimorioMentalizacao: GrimorioSchool[] = [
  { id: 'ilusao', name: 'Ilusão', subtitle: 'A máscara da mente', description: 'Dobra aparências, sentidos e certezas.', accent: '#a990cf' },
  { id: 'telecinese', name: 'Telecinese', subtitle: 'A força sem toque', description: 'Move a matéria pela força do pensamento.', accent: '#779ec5' },
  { id: 'telepatia', name: 'Telepatia', subtitle: 'A voz interior', description: 'Percorre pensamentos, memórias e vontades.', accent: '#759e9d' },
];

export const grimorioMaiorSchools: GrimorioSchool[] = [
  { id: 'halomancia', name: 'Halomancia', subtitle: 'A coroa do sagrado', description: 'Canaliza halos, bênçãos e a luz das antigas devoções.', accent: '#d6b56a' },
  { id: 'animagia', name: 'Animagia', subtitle: 'A pele das feras', description: 'Desperta formas animais e instintos ancestrais.', accent: '#8fa86b' },
  { id: 'muliphia', name: 'Mulíphia', subtitle: 'Os véus da multiplicidade', description: 'Reúne essências diversas em uma única vontade arcana.', accent: '#b48ac6' },
  { id: 'transfiguracao', name: 'Transfiguração', subtitle: 'A matéria se curva', description: 'Altera formas, propriedades e destinos da matéria.', accent: '#c59a60' },
  { id: 'vampirismo', name: 'Vampirismo', subtitle: 'A fome imortal', description: 'Converte vitalidade, sangue e sombra em poder.', accent: '#a85c67' },
];

export const grimorioExotericoSchools: GrimorioSchool[] = [
  { id: 'divinacao', name: 'Divinação', subtitle: 'O olhar além do véu', description: 'Lê presságios e revela os caminhos ocultos do destino.', accent: '#8ca4c2' },
  { id: 'encantamento', name: 'Encantamento', subtitle: 'Palavras que prendem', description: 'Inscreve desejos na mente e na vontade dos seres.', accent: '#c58fa7' },
  { id: 'bruxaria', name: 'Bruxaria', subtitle: 'O saber das encruzilhadas', description: 'Cultiva pactos, poções e ritos de poder indomado.', accent: '#9a7f9d' },
  { id: 'oniromancia', name: 'Oniromancia', subtitle: 'Os caminhos do sonho', description: 'Percorre sonhos, pesadelos e os símbolos do inconsciente.', accent: '#7f9dc1' },
];

export const grimorioCosmicoSchools: GrimorioSchool[] = [
  { id: 'ubicinese', name: 'Ubicinese', subtitle: 'Espaço', description: 'Dobra distâncias e abre passagens entre pontos do mundo.', accent: '#9aa6d1' },
  { id: 'gravitocinese', name: 'Gravitocinese', subtitle: 'Gravidade', description: 'Comanda o peso, a queda e a órbita de todas as coisas.', accent: '#b08caa' },
  { id: 'radiocinese', name: 'Radiocinese', subtitle: 'Radiação', description: 'Molda ondas e energias que atravessam a matéria.', accent: '#d19b62' },
  { id: 'umbracinese', name: 'Umbracinese', subtitle: 'Escuridão', description: 'Convoca o silêncio profundo onde a luz não alcança.', accent: '#776b94' },
  { id: 'lumocinese', name: 'Lumocinese', subtitle: 'Luz', description: 'Tessela claridade em revelação, defesa e esplendor.', accent: '#d8be70' },
  { id: 'cronocinese', name: 'Cronocinese', subtitle: 'Tempo', description: 'Escuta o fluxo das eras e retarda ou acelera seus passos.', accent: '#a18a72' },
];

export const grimorioAdditionalSchools: GrimorioSchool[] = [
  ...grimorioMaiorSchools,
  ...grimorioExotericoSchools,
  ...grimorioCosmicoSchools,
];

export const GRIMORIO_ELEMENT_TREE = [
  ['piromancia', 'hidromancia', 'geomancia', 'aeromancia'],
  ['eletromancia', 'criromancia', 'magmancia', 'arenomancia'],
  ['metalomancia', 'dinamancia', 'atmomancia', 'fitocinese', 'pneumamancia'],
  ['nihilmancia', 'oximancia', 'plasmamancia', 'magnetomancia', 'eteromancia'],
] as const;

export const grimorioVolumes: GrimorioVolume[] = [
  ...grimorioSchools.flatMap((school) => [
  {
    id: `${school.id}-volume-i`, schoolId: school.id, number: 'I', title: 'Fundamentos', subtitle: 'O primeiro círculo',
    description: `Os princípios essenciais da escola de ${school.name.toLowerCase()}.`, spellIds: [`${school.id}-spell-1`, `${school.id}-spell-2`, `${school.id}-spell-3`],
  },
  {
    id: `${school.id}-volume-ii`, schoolId: school.id, number: 'II', title: 'Práticas', subtitle: 'O segundo círculo',
    description: 'Técnicas para conjuradores que já conhecem o próprio poder.', spellIds: [`${school.id}-spell-4`, `${school.id}-spell-5`, `${school.id}-spell-6`],
  },
  {
    id: `${school.id}-volume-iii`, schoolId: school.id, number: 'III', title: 'Tratados Maiores', subtitle: 'O terceiro círculo',
    description: 'Fórmulas raras, legadas pelos mestres da tradição.', spellIds: [`${school.id}-spell-7`, `${school.id}-spell-8`],
  },
]),
  ...grimorioElementos.flatMap((elemento) => [
    {
      id: `${elemento.id}-volume-i`, schoolId: elemento.id, number: 'I', title: 'Fundamentos', subtitle: 'O primeiro círculo',
      description: `Os princípios essenciais da escola de ${elemento.name.toLowerCase()}.`, spellIds: [`${elemento.id}-spell-1`],
    },
    {
      id: `${elemento.id}-volume-ii`, schoolId: elemento.id, number: 'II', title: 'Práticas', subtitle: 'O segundo círculo',
      description: 'Técnicas para conjuradores que já conhecem o próprio poder.', spellIds: [`${elemento.id}-spell-2`],
    },
    {
      id: `${elemento.id}-volume-iii`, schoolId: elemento.id, number: 'III', title: 'Tratados Maiores', subtitle: 'O terceiro círculo',
      description: 'Fórmulas raras, legadas pelos mestres da tradição.', spellIds: [`${elemento.id}-spell-3`],
    },
  ]),
  ...grimorioMentalizacao.flatMap((subcategoria) => [
    {
      id: `${subcategoria.id}-volume-i`, schoolId: subcategoria.id, number: 'I', title: 'Fundamentos', subtitle: 'O primeiro círculo',
      description: `Os princípios essenciais da escola de ${subcategoria.name.toLowerCase()}.`, spellIds: [`${subcategoria.id}-spell-1`, `${subcategoria.id}-spell-2`, `${subcategoria.id}-spell-3`],
    },
    {
      id: `${subcategoria.id}-volume-ii`, schoolId: subcategoria.id, number: 'II', title: 'Práticas', subtitle: 'O segundo círculo',
      description: 'Técnicas para conjuradores que já conhecem o próprio poder.', spellIds: [`${subcategoria.id}-spell-4`, `${subcategoria.id}-spell-5`, `${subcategoria.id}-spell-6`],
    },
    {
      id: `${subcategoria.id}-volume-iii`, schoolId: subcategoria.id, number: 'III', title: 'Tratados Maiores', subtitle: 'O terceiro círculo',
      description: 'Fórmulas raras, legadas pelos mestres da tradição.', spellIds: [`${subcategoria.id}-spell-7`, `${subcategoria.id}-spell-8`],
    },
  ]),
  ...grimorioAdditionalSchools.flatMap((school) => [
    {
      id: `${school.id}-volume-i`, schoolId: school.id, number: 'I', title: 'Fundamentos', subtitle: 'O primeiro círculo',
      description: `Os princípios essenciais da escola de ${school.name.toLowerCase()}.`, spellIds: [`${school.id}-spell-1`, `${school.id}-spell-2`, `${school.id}-spell-3`],
    },
    {
      id: `${school.id}-volume-ii`, schoolId: school.id, number: 'II', title: 'Práticas', subtitle: 'O segundo círculo',
      description: 'Técnicas para conjuradores que já conhecem o próprio poder.', spellIds: [`${school.id}-spell-4`, `${school.id}-spell-5`, `${school.id}-spell-6`],
    },
    {
      id: `${school.id}-volume-iii`, schoolId: school.id, number: 'III', title: 'Tratados Maiores', subtitle: 'O terceiro círculo',
      description: 'Fórmulas raras, legadas pelos mestres da tradição.', spellIds: [`${school.id}-spell-7`, `${school.id}-spell-8`],
    },
  ]),
];

export const getSchoolVolumes = (schoolId: string) => grimorioVolumes.filter((volume) => volume.schoolId === schoolId);
