import { getSchoolVolumes, grimorioAllSchools, type GrimorioSpell } from '@/mocks/grimorio';

export interface MensagemImportacaoMagia {
  posicao: number;
  motivo: string;
}

export interface MagiaRepetidaImportacao extends MensagemImportacaoMagia {
  id: string;
}

export interface ResultadoParseImportacaoMagias {
  validas: GrimorioSpell[];
  erros: MensagemImportacaoMagia[];
  avisos: MensagemImportacaoMagia[];
  idsRepetidos: MagiaRepetidaImportacao[];
}

const VISUAIS = ['fire', 'water', 'wind', 'earth', 'ward', 'summon', 'mind', 'restore', 'death'] as const;

function linhaDoErroJson(texto: string, error: unknown): number {
  const match = error instanceof SyntaxError ? error.message.match(/position\s+(\d+)/i) : null;
  if (!match) return 1;
  return texto.slice(0, Number(match[1])).split('\n').length;
}

export function parsearImportacaoDeMagias(texto: string): ResultadoParseImportacaoMagias {
  const resultado: ResultadoParseImportacaoMagias = { validas: [], erros: [], avisos: [], idsRepetidos: [] };
  let conteudo: unknown;
  try {
    conteudo = JSON.parse(texto);
  } catch (error) {
    resultado.erros.push({ posicao: linhaDoErroJson(texto, error), motivo: `JSON inválido: ${error instanceof Error ? error.message : String(error)}` });
    return resultado;
  }

  if (!Array.isArray(conteudo)) {
    resultado.erros.push({ posicao: 1, motivo: 'O arquivo precisa conter um array JSON de objetos de magia.' });
    return resultado;
  }

  const idsVistos = new Set<string>();
  const escolas = new Set(grimorioAllSchools.map((school) => school.id));

  conteudo.forEach((item: unknown, index: number) => {
    const posicao = index + 1;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      resultado.erros.push({ posicao, motivo: 'O item precisa ser um objeto de magia.' });
      return;
    }

    const magia = item as Record<string, unknown>;
    let id: string;
    if (magia.id === undefined || magia.id === null || magia.id === '') {
      id = `custom-spell-${Date.now()}-${posicao}`;
      resultado.avisos.push({ posicao, motivo: `ID ausente; foi gerado o ID ${id}.` });
    } else if (typeof magia.id !== 'string' || !magia.id.trim()) {
      resultado.erros.push({ posicao, motivo: 'O campo id precisa ser uma string não vazia.' });
      return;
    } else {
      id = magia.id;
    }

    if (idsVistos.has(id)) {
      resultado.idsRepetidos.push({ posicao, id, motivo: `O ID ${id} já apareceu neste arquivo; esta ocorrência foi ignorada.` });
      return;
    }
    idsVistos.add(id);

    const errosItem: string[] = [];
    if (typeof magia.name !== 'string' || !magia.name.trim()) errosItem.push('name é obrigatório e não pode estar vazio.');
    if (typeof magia.schoolId !== 'string' || !escolas.has(magia.schoolId)) {
      errosItem.push(`schoolId inválido: ${String(magia.schoolId ?? 'ausente')} não pertence a uma escola conhecida.`);
    } else if (typeof magia.volumeId !== 'string' || !getSchoolVolumes(magia.schoolId).some((volume) => volume.id === magia.volumeId)) {
      errosItem.push(`volumeId inválido: ${String(magia.volumeId ?? 'ausente')} não pertence à escola ${magia.schoolId}.`);
    }

    if (magia.image !== undefined) {
      if (typeof magia.image !== 'string' || (!magia.image.startsWith('data:image') && !magia.image.startsWith('http'))) {
        errosItem.push('image precisa começar com http ou data:image em base64.');
      }
    }

    if (errosItem.length) {
      errosItem.forEach((motivo) => resultado.erros.push({ posicao, motivo }));
      return;
    }

    const visual = typeof magia.visual === 'string' && (VISUAIS as readonly string[]).includes(magia.visual)
      ? magia.visual as GrimorioSpell['visual']
      : 'earth';
    if (!(typeof magia.visual === 'string' && (VISUAIS as readonly string[]).includes(magia.visual))) {
      resultado.avisos.push({ posicao, motivo: `visual desconhecido (${String(magia.visual ?? 'ausente')}); será usado earth.` });
    }

    resultado.validas.push({ ...magia, id, visual } as GrimorioSpell);
  });

  return resultado;
}
