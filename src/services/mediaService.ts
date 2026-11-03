import { supabase } from '@/integrations/supabase/client';
import { useSessionStore } from '@/store/useSessionStore';
import { compressImage } from '@/utils/imageCompressor';
import { fichaService } from './fichaService';
import { mercadoService } from './mercadoService';
import { atualizarMagia, mapearMagiaDoRow } from './grimorioService';

export type PastaMidia = 'fichas' | 'personagens' | 'mercado' | 'perfis' | 'grimorio';
export interface OpcoesImagem { maxWidth?: number; maxHeight?: number; quality?: number; escopo?: string; }

/**
 * URL de exibição reduzida do Storage, só para caixas pequenas. O recorte é
 * quadrado (as caixas das listas são) e isso devolve bem menos bytes que a
 * largura sozinha: medido no acervo, 10.631 bytes contra 123.532 da original.
 * URLs que não são do bucket (base64 legado, link externo) voltam como estão.
 */
export function urlMiniatura(url: string | null | undefined, lado = 240): string {
  if (!url) return '';
  const caminhoPublico = '/storage/v1/object/public/';
  if (!url.includes(caminhoPublico)) return url;
  const separador = url.includes('?') ? '&' : '?';
  return `${url.replace(caminhoPublico, '/storage/v1/render/image/public/')}${separador}width=${lado}&height=${lado}&resize=cover&quality=70`;
}

export interface InventarioMidiaLegada {
  fichas: number;
  personagens: number;
  mercado: number;
  grimorio: number;
  totalBytes: number;
}

export interface RelatorioMigracao {
  convertidas: number;
  ignoradas: number;
  falhas: string[];
  bytesLiberados: number;
}

export interface RelatorioMigracaoLote extends RelatorioMigracao {
  motivo?: string;
}

const EXTENSOES_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

const CAMINHOS_IMAGEM_FICHA = [
  ['identidade', 'imagem_url'],
  ['suporte', 'armamento', 'arma_primaria', 'imagem_url'],
  ['suporte', 'armamento', 'segunda_arma', 'imagem_url'],
  ['suporte', 'armamento', 'arma_suporte', 'imagem_url'],
  ['suporte', 'armamento', 'arco_ld', 'imagem_url'],
  ['suporte', 'armadura', 'imagem_url'],
  ['suporte', 'montaria', 'imagem_url'],
] as const;

type DadosImagem = Record<string, unknown>;
type FichaImagemRow = { character_id: string; tenant_id: string; dados: DadosImagem | null };
type CharacterImagemRow = {
  id: string;
  tenant_id: string;
  imagem_url: string | null;
  large_image_url: string | null;
};
type MarketImagemRow = { id: string; imagem_url: string };
type GrimorioImagemRow = { id: string; dados: unknown };

type RespostaLoteGrimorio = {
  ok: boolean;
  processados?: number;
  convertidas?: number;
  restantes?: number;
  falhas?: string[];
  motivo?: string;
};

function ehBase64(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('data:image');
}

function ehUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function tamanhoEmBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function lerCaminho(dados: DadosImagem, caminho: readonly string[]): unknown {
  let valor: unknown = dados;
  for (const segmento of caminho) {
    if (!valor || typeof valor !== 'object') return undefined;
    valor = (valor as Record<string, unknown>)[segmento];
  }
  return valor;
}

function gravarCaminho(dados: DadosImagem, caminho: readonly string[], value: string): void {
  let atual = dados;
  for (const segmento of caminho.slice(0, -1)) {
    const proximo = atual[segmento];
    if (!proximo || typeof proximo !== 'object' || Array.isArray(proximo)) return;
    atual = proximo as Record<string, unknown>;
  }
  atual[caminho[caminho.length - 1]] = value;
}

function temImagemBase64NaFicha(dados: DadosImagem | null): boolean {
  return Boolean(dados && CAMINHOS_IMAGEM_FICHA.some((caminho) => ehBase64(lerCaminho(dados, caminho))));
}

function totalImagemFicha(dados: DadosImagem | null): number {
  if (!dados) return 0;
  return CAMINHOS_IMAGEM_FICHA.reduce((total, caminho) => {
    const valor = lerCaminho(dados, caminho);
    return total + (ehBase64(valor) ? tamanhoEmBytes(valor) : 0);
  }, 0);
}

function obterCaminhoStorage(pasta: PastaMidia, extensao: string, opcoes?: OpcoesImagem): string {
  if (pasta === 'mercado' || pasta === 'grimorio') {
    return `${pasta}/${crypto.randomUUID()}.${extensao}`;
  }

  const usuario = useSessionStore.getState().session?.user;
  let segmento = opcoes?.escopo;
  if (segmento === undefined && (pasta === 'fichas' || pasta === 'personagens')) {
    if (!usuario?.tenant_id) throw new Error('Não foi possível identificar sua organização para enviar a imagem.');
    segmento = usuario.tenant_id;
  } else if (segmento === undefined && pasta === 'perfis') {
    if (!usuario?.id) throw new Error('Não foi possível identificar sua conta para enviar a foto de perfil.');
    segmento = usuario.id;
  }

  return `${segmento}/${pasta}/${crypto.randomUUID()}.${extensao}`;
}

/** O Storage devolve status/código em propriedades do erro; sem eles a falha fica sem diagnóstico. */
function descreverErro(causa: unknown): string {
  if (!(causa instanceof Error)) return String(causa);
  const { status, statusCode } = causa as { status?: unknown; statusCode?: unknown };
  const codigos = [
    status !== undefined ? `status ${String(status)}` : null,
    statusCode !== undefined ? `código ${String(statusCode)}` : null,
  ].filter(Boolean);
  return codigos.length ? `${causa.message} (${codigos.join(', ')})` : causa.message;
}

function codificarBase64(bytes: Uint8Array): string {
  let binario = '';
  for (let inicio = 0; inicio < bytes.length; inicio += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(inicio, inicio + 0x8000));
  }
  return btoa(binario);
}

interface RespostaUploadMidia {
  ok: boolean;
  url?: string;
  detalhe?: string;
}

/**
 * O preflight (OPTIONS) da rota de funções é recusado pelo navegador neste
 * projeto: a resposta do POST chega com CORS correto, mas o OPTIONS não passa e
 * a falha aparece como "Failed to fetch". Uma requisição "simples" — POST com
 * `Content-Type: text/plain` e sem cabeçalhos customizados — não exige preflight,
 * então o token da sessão vai no corpo e é verificado no servidor.
 */
const URL_FUNCAO_MIDIA = 'https://qmwrpcyzcmmjrjzsorgx.supabase.co/functions/v1/midia-upload';

/** A requisição não completou: nada foi gravado e o envio pode ser repetido. */
class ErroSemResposta extends Error {
  constructor(detalhe: string) {
    super(`A função de upload não respondeu (${detalhe}).`);
  }
}

async function chamarFuncaoMidia<T>(corpo: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sessão expirada. Entre novamente na plataforma.');

  let resposta: Response | null = null;
  try {
    resposta = await fetch(URL_FUNCAO_MIDIA, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ ...corpo, token }),
    });
  } catch (causa) {
    console.warn('[mediaService] Requisição simples à função de upload falhou; tentando pelo SDK.', { detalhe: descreverErro(causa) });
  }

  if (!resposta) {
    const { data: dados, error } = await supabase.functions.invoke<T>('midia-upload', { body: corpo });
    if (!error) {
      if (!dados) throw new Error('Resposta vazia da função de upload.');
      return dados;
    }
    if ((error as Error).name === 'FunctionsFetchError') throw new ErroSemResposta(descreverErro(error));
    const contexto = (error as Error & { context?: unknown }).context;
    const corpoErro = contexto instanceof Response ? await contexto.text() : '';
    throw new Error(`${descreverErro(error)}${corpoErro ? `: ${corpoErro}` : ''}`);
  }

  const texto = await resposta.text();
  let dados: T | null = null;
  try {
    dados = texto ? (JSON.parse(texto) as T) : null;
  } catch {
    dados = null;
  }
  if (!dados) throw new Error(`A função de upload respondeu ${resposta.status}: ${texto.slice(0, 200) || resposta.statusText}`);
  const motivo = (dados as { motivo?: unknown }).motivo;
  if (!resposta.ok && typeof motivo === 'string') throw new Error(motivo);
  return dados;
}

/** Sem resposta = a requisição não completou; um erro HTTP traz resposta e é tratado à parte. */
function falhouSemResposta(causa: unknown): boolean {
  return causa instanceof ErroSemResposta;
}

/**
 * Envia os bytes direto ao bucket. Um corpo que não é Blob/FormData segue como
 * binário cru e exige `contentType` explícito — sem ele o storage-js envia
 * `text/plain;charset=UTF-8` e o bucket, que limita os MIME types, recusa com 400.
 */
async function enviarViaStorage(caminho: string, bytes: Uint8Array, mime: string): Promise<string> {
  const bucket = supabase.storage.from('midia');
  const { error } = await bucket.upload(caminho, bytes, { contentType: mime, upsert: false });
  // 409 = o objeto já existe (envio anterior sem resposta): a imagem está lá, a URL é a mesma.
  const codigo = String((error as { statusCode?: unknown } | null)?.statusCode ?? '');
  if (error && codigo !== '409') throw error;
  return bucket.getPublicUrl(caminho).data.publicUrl;
}

async function enviarBlob(source: Blob | string, mime: string, pasta: PastaMidia, opcoes?: OpcoesImagem): Promise<string> {
  const extensao = EXTENSOES_POR_MIME[mime];
  if (!extensao) {
    throw new Error('Não foi possível enviar esta imagem. Use JPEG, PNG, WebP, GIF ou SVG.');
  }
  const caminho = obterCaminhoStorage(pasta, extensao, opcoes);

  let bytes: Uint8Array | null = null;
  try {
    const blob = typeof source === 'string' ? await (await fetch(source)).blob() : source;
    bytes = new Uint8Array(await blob.arrayBuffer());
    const dados = await chamarFuncaoMidia<RespostaUploadMidia>({ caminho, mime, conteudoBase64: codificarBase64(bytes) });
    if (dados.ok && typeof dados.url === 'string') return dados.url;
    if (!dados.ok && typeof dados.detalhe === 'string') throw new Error(dados.detalhe);
    throw new Error('Resposta inválida da função de upload.');
  } catch (causa) {
    if (bytes && falhouSemResposta(causa)) {
      console.warn('[mediaService] Função de upload inacessível pelo navegador; enviando direto ao Storage.', { caminho });
      return await enviarViaStorage(caminho, bytes, mime);
    }
    const detalhe = descreverErro(causa);
    console.error('[mediaService] Falha ao enviar imagem', { caminho, detalhe });
    throw new Error(`Não foi possível enviar a imagem: ${detalhe}`);
  }
}

function mimeDeDataUrl(dataUrl: string): string {
  const mime = dataUrl.match(/^data:(image\/[^;,]+)(?:;[^,]*)?,/i)?.[1]?.toLowerCase();
  if (!mime || !EXTENSOES_POR_MIME[mime]) {
    throw new Error('Não foi possível enviar esta imagem. Use JPEG, PNG, WebP, GIF ou SVG.');
  }
  return mime;
}

export async function enviarImagem(
  source: File | string,
  pasta: PastaMidia,
  opcoes?: OpcoesImagem,
): Promise<string> {
  if (typeof source === 'string' && /^https?:\/\//i.test(source)) return source;

  const imagemComprimida = await compressImage(
    source,
    opcoes?.maxWidth ?? 600,
    opcoes?.maxHeight ?? 600,
    opcoes?.quality ?? 0.82,
  );
  if (!imagemComprimida.startsWith('data:')) return imagemComprimida;

  const mime = mimeDeDataUrl(imagemComprimida);
  return enviarBlob(imagemComprimida, mime, pasta, opcoes);
}

export async function moverImagemParaArmazenamento(dataUrl: string, pasta: PastaMidia): Promise<string> {
  const mime = mimeDeDataUrl(dataUrl);
  return enviarBlob(dataUrl, mime, pasta);
}

export async function migrarGrimorioEmLotes(
  aoProgredir?: (convertidas: number, total: number) => void,
): Promise<RelatorioMigracaoLote> {
  const relatorio: RelatorioMigracaoLote = { convertidas: 0, ignoradas: 0, falhas: [], bytesLiberados: 0 };
  let total = 0;
  let restantes = 0;
  const tetoDeLotes = 100;
  aoProgredir?.(0, 0);

  for (let lote = 0; lote < tetoDeLotes; lote += 1) {
    const data = await chamarFuncaoMidia<RespostaLoteGrimorio>({ modo: 'lote-grimorio' });
    const convertidasNoLote = data.convertidas ?? 0;
    if (lote === 0) total = (data.processados ?? 0) + (data.restantes ?? 0);
    relatorio.convertidas += convertidasNoLote;
    restantes = data.restantes ?? 0;
    relatorio.falhas.push(...(data.falhas ?? []));
    aoProgredir?.(relatorio.convertidas, total);
    if (!data.ok) {
      relatorio.motivo = data.motivo ?? 'A migração em lote foi interrompida pelo servidor.';
      return { ...relatorio, falhas: [...new Set(relatorio.falhas)] };
    }
    if (restantes === 0) return { ...relatorio, falhas: [...new Set(relatorio.falhas)] };
    // Sem progresso: as magias que sobraram falharam de novo. Sem esta guarda o
    // laço repetiria tentativas inúteis até o teto de lotes.
    if (convertidasNoLote === 0) {
      relatorio.motivo = 'As magias restantes não puderam ser convertidas. Veja as falhas listadas abaixo.';
      return { ...relatorio, falhas: [...new Set(relatorio.falhas)] };
    }
  }

  relatorio.motivo = 'A migração foi interrompida ao atingir o limite de segurança de lotes.';
  return { ...relatorio, falhas: [...new Set(relatorio.falhas)] };
}

async function carregarLinhasMigracao() {
  const [mercadoResult, fichasResult, personagensResult, grimorioResult] = await Promise.all([
    supabase.from('market_items').select('id, imagem_url').like('imagem_url', 'data:%'),
    supabase.from('fichas').select('character_id, tenant_id, dados'),
    supabase.from('characters').select('id, tenant_id, imagem_url, large_image_url'),
    supabase.from('grimorio_spells').select('id, dados').gt('imagem_bytes', 0),
  ]);
  if (mercadoResult.error) throw new Error('Não foi possível inventariar as imagens do mercado: ' + mercadoResult.error.message);
  if (fichasResult.error) throw new Error('Não foi possível inventariar as imagens das fichas: ' + fichasResult.error.message);
  if (personagensResult.error) throw new Error('Não foi possível inventariar as imagens dos personagens: ' + personagensResult.error.message);
  if (grimorioResult.error) throw new Error('Não foi possível inventariar as imagens do grimório: ' + grimorioResult.error.message);

  return {
    mercado: ((mercadoResult.data ?? []) as MarketImagemRow[]).filter((row) => ehBase64(row.imagem_url)),
    fichas: ((fichasResult.data ?? []) as FichaImagemRow[]).filter((row) => temImagemBase64NaFicha(row.dados)),
    personagens: ((personagensResult.data ?? []) as CharacterImagemRow[]).filter(
      (row) => ehBase64(row.imagem_url) || ehBase64(row.large_image_url),
    ),
    grimorio: ((grimorioResult.data ?? []) as GrimorioImagemRow[])
      .map(mapearMagiaDoRow)
      .filter((magia) => ehBase64(magia.image)),
  };
}

export async function inventariarMidiaLegada(): Promise<InventarioMidiaLegada> {
  const linhas = await carregarLinhasMigracao();
  const totalBytesMercado = linhas.mercado.reduce((total, row) => total + tamanhoEmBytes(row.imagem_url), 0);
  const totalBytesFichas = linhas.fichas.reduce((total, row) => total + totalImagemFicha(row.dados), 0);
  const totalBytesPersonagens = linhas.personagens.reduce((total, row) => {
    return total + (ehBase64(row.imagem_url) ? tamanhoEmBytes(row.imagem_url) : 0)
      + (ehBase64(row.large_image_url) ? tamanhoEmBytes(row.large_image_url) : 0);
  }, 0);
  const totalBytesGrimorio = linhas.grimorio.reduce((total, magia) => {
    return total + (ehBase64(magia.image) ? tamanhoEmBytes(magia.image) : 0);
  }, 0);
  return {
    fichas: linhas.fichas.length,
    personagens: linhas.personagens.length,
    mercado: linhas.mercado.length,
    grimorio: linhas.grimorio.length,
    totalBytes: totalBytesMercado + totalBytesFichas + totalBytesPersonagens + totalBytesGrimorio,
  };
}

export async function migrarMidiaLegada(
  aoProgredir?: (concluidos: number, total: number) => void,
): Promise<RelatorioMigracao> {
  const linhas = await carregarLinhasMigracao();
  const total = linhas.mercado.length + linhas.fichas.length + linhas.personagens.length + linhas.grimorio.length;
  const relatorio: RelatorioMigracao = { convertidas: 0, ignoradas: 0, falhas: [], bytesLiberados: 0 };
  let concluidos = 0;
  aoProgredir?.(0, total);

  const concluirItem = () => {
    concluidos += 1;
    aoProgredir?.(concluidos, total);
  };

  for (const row of linhas.mercado) {
    const imagemOriginal = row.imagem_url;
    try {
      if (ehUrl(imagemOriginal)) {
        relatorio.ignoradas += 1;
      } else if (ehBase64(imagemOriginal)) {
        const url = await enviarImagem(imagemOriginal, 'mercado');
        const { error } = await supabase.from('market_items').update({ imagem_url: url }).eq('id', row.id);
        if (error) throw new Error(error.message);
        relatorio.convertidas += 1;
        relatorio.bytesLiberados += tamanhoEmBytes(imagemOriginal) - tamanhoEmBytes(url);
      }
    } catch (error) {
      relatorio.falhas.push(`Mercadoria ${row.id}: ${error instanceof Error ? error.message : 'falha desconhecida'}`);
    } finally {
      concluirItem();
    }
  }

  for (const row of linhas.fichas) {
    const dados = JSON.parse(JSON.stringify(row.dados ?? {})) as DadosImagem;
    const conversoes: { original: string; url: string }[] = [];
    for (const caminho of CAMINHOS_IMAGEM_FICHA) {
      const original = lerCaminho(dados, caminho);
      const rotulo = caminho.join('.');
      if (ehUrl(original)) {
        relatorio.ignoradas += 1;
      } else if (ehBase64(original)) {
        try {
          const url = await enviarImagem(original, 'fichas', { escopo: row.tenant_id });
          gravarCaminho(dados, caminho, url);
          conversoes.push({ original, url });
        } catch (error) {
          relatorio.falhas.push(`Ficha ${row.character_id} (${rotulo}): ${error instanceof Error ? error.message : 'falha desconhecida'}`);
        }
      }
    }
    if (conversoes.length > 0) {
      let erroGravacao: string | null = null;
      try {
        const { error } = await supabase.from('fichas').update({ dados }).eq('character_id', row.character_id).eq('tenant_id', row.tenant_id);
        erroGravacao = error?.message ?? null;
      } catch (error) {
        erroGravacao = error instanceof Error ? error.message : 'falha desconhecida';
      }
      if (erroGravacao) {
        relatorio.falhas.push(`Ficha ${row.character_id}: não foi possível gravar as imagens convertidas. ${erroGravacao}`);
      } else {
        relatorio.convertidas += conversoes.length;
        relatorio.bytesLiberados += conversoes.reduce((totalBytes, conversion) => totalBytes + tamanhoEmBytes(conversion.original) - tamanhoEmBytes(conversion.url), 0);
      }
    }
    concluirItem();
  }

  for (const row of linhas.personagens) {
    const atualizacoes: { imagem_url?: string; large_image_url?: string } = {};
    const conversoes: { original: string; url: string }[] = [];
    for (const coluna of ['imagem_url', 'large_image_url'] as const) {
      const original = row[coluna];
      if (ehUrl(original)) {
        relatorio.ignoradas += 1;
      } else if (ehBase64(original)) {
        try {
          const url = await enviarImagem(original, 'personagens', { escopo: row.tenant_id });
          atualizacoes[coluna] = url;
          conversoes.push({ original, url });
        } catch (error) {
          relatorio.falhas.push(`Personagem ${row.id} (${coluna}): ${error instanceof Error ? error.message : 'falha desconhecida'}`);
        }
      }
    }
    if (conversoes.length > 0) {
      let erroGravacao: string | null = null;
      try {
        const { error } = await supabase.from('characters').update(atualizacoes).eq('id', row.id).eq('tenant_id', row.tenant_id);
        erroGravacao = error?.message ?? null;
      } catch (error) {
        erroGravacao = error instanceof Error ? error.message : 'falha desconhecida';
      }
      if (erroGravacao) {
        relatorio.falhas.push(`Personagem ${row.id}: não foi possível gravar as imagens convertidas. ${erroGravacao}`);
      } else {
        relatorio.convertidas += conversoes.length;
        relatorio.bytesLiberados += conversoes.reduce((totalBytes, conversion) => totalBytes + tamanhoEmBytes(conversion.original) - tamanhoEmBytes(conversion.url), 0);
      }
    }
    concluirItem();
  }

  for (const magia of linhas.grimorio) {
    const imagemOriginal = magia.image;
    try {
      if (ehBase64(imagemOriginal)) {
        const url = await moverImagemParaArmazenamento(imagemOriginal, 'grimorio');
        await atualizarMagia({ ...magia, image: url });
        relatorio.convertidas += 1;
        relatorio.bytesLiberados += tamanhoEmBytes(imagemOriginal) - tamanhoEmBytes(url);
      }
    } catch (error) {
      relatorio.falhas.push(`Magia ${magia.id}: ${error instanceof Error ? error.message : 'falha desconhecida'}`);
    } finally {
      concluirItem();
    }
  }

  fichaService.invalidarCacheAcervo();
  mercadoService.limparCaches();
  return relatorio;
}
