import { formatarTamanhoArquivo } from '../config/biblioteca';
import { invalidateAsyncDataCache } from '../hooks/useAsyncData';
import { supabase } from '../integrations/supabase/client';
import { useSessionStore } from '../store/useSessionStore';
import type { EntradaIndiceBiblioteca, ItemBiblioteca, NovoItemBiblioteca } from '../types';
import { normalizarBusca, TAMANHO_MINIMO_BUSCA } from '../utils/normalizarBusca';
import { cacheKeyPrefixes } from './cacheKeys';

/** Bucket PRIVADO do acervo: guarda só PDF e é lido por URL assinada. */
const BUCKET_ACERVO = 'biblioteca';

/**
 * Teto do envio: a função de borda recebe o PDF inteiro em base64 no corpo da
 * requisição, e acima disso a conversão deixa de ser segura. Arquivos maiores
 * continuam possíveis pelo campo de link externo.
 */
export const LIMITE_UPLOAD_PDF_BYTES = 20 * 1024 * 1024;

const URL_FUNCAO_BIBLIOTECA_UPLOAD =
  'https://qmwrpcyzcmmjrjzsorgx.supabase.co/functions/v1/biblioteca-upload';

/** Validade da URL assinada, suficiente para uma sessão inteira de leitura. */
const VALIDADE_URL_ASSINADA_SEGUNDOS = 60 * 60;

const COLUNAS_ITEM =
  'id, tipo, categoria, titulo, subtitulo, descricao, capa_url, arquivo_caminho, arquivo_url, arquivo_bytes, indice, conteudo, oculto, created_at, updated_at';

interface ItemRow {
  id: string;
  tipo: string;
  categoria: string;
  titulo: string;
  subtitulo: string | null;
  descricao: string | null;
  capa_url: string | null;
  arquivo_caminho: string | null;
  arquivo_url: string | null;
  arquivo_bytes: number | null;
  indice: unknown;
  conteudo: string | null;
  oculto: boolean;
  created_at: string;
  updated_at: string;
}

/** O `indice` é jsonb livre no banco: o formato é validado aqui, na fronteira. */
function mapearIndice(valor: unknown): EntradaIndiceBiblioteca[] {
  if (!Array.isArray(valor)) return [];
  return valor.flatMap((entrada) => {
    if (!entrada || typeof entrada !== 'object') return [];
    const { titulo, pagina } = entrada as { titulo?: unknown; pagina?: unknown };
    if (typeof titulo !== 'string' || !titulo.trim()) return [];
    const numero = typeof pagina === 'number' ? pagina : Number(pagina);
    if (!Number.isFinite(numero) || numero < 1) return [];
    return [{ titulo: titulo.trim(), pagina: Math.floor(numero) }];
  });
}

function mapearItem(row: ItemRow): ItemBiblioteca {
  return {
    id: row.id,
    tipo: row.tipo === 'pergaminho' ? 'pergaminho' : 'pdf',
    categoria: row.categoria,
    titulo: row.titulo,
    subtitulo: row.subtitulo ?? undefined,
    descricao: row.descricao ?? undefined,
    capaUrl: row.capa_url ?? undefined,
    arquivoCaminho: row.arquivo_caminho ?? undefined,
    arquivoUrl: row.arquivo_url ?? undefined,
    arquivoBytes: row.arquivo_bytes ?? undefined,
    indice: mapearIndice(row.indice),
    conteudo: row.conteudo ?? undefined,
    oculto: row.oculto,
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
  };
}

/** Campos comuns à publicação e à edição. */
function paraColunas(dados: NovoItemBiblioteca) {
  return {
    tipo: dados.tipo,
    categoria: dados.categoria,
    titulo: dados.titulo.trim(),
    subtitulo: dados.subtitulo?.trim() || null,
    descricao: dados.descricao?.trim() || null,
    capa_url: dados.capaUrl ?? null,
    arquivo_caminho: dados.arquivoCaminho ?? null,
    arquivo_url: dados.arquivoUrl ?? null,
    arquivo_bytes: dados.arquivoBytes ?? null,
    indice: dados.indice,
    conteudo: dados.conteudo ?? null,
    oculto: dados.oculto,
  };
}

function invalidarCache(): void {
  invalidateAsyncDataCache(cacheKeyPrefixes.biblioteca);
}

/** Filtros do acervo, aplicados no banco — a tela não baixa o catálogo inteiro. */
export interface FiltrosAcervo {
  /** Id de `CATEGORIAS_BIBLIOTECA`; vazio traz todas as categorias. */
  categoria?: string | null;
  /** Busca textual sobre a coluna normalizada `busca`. */
  termo?: string | null;
}

export const bibliotecaService = {
  /**
   * Acervo visível, em ordem alfabética (pela coluna normalizada, para acento
   * não deslocar a ordem). A RLS decide o que cada conta enxerga — o
   * Administrador também recebe o que está oculto. O filtro de categoria e a
   * busca são resolvidos no banco, sobre a coluna gerada `busca` (índice de
   * trigrama), como nos catálogos do Mercado e do Grimório: um termo com menos
   * de `TAMANHO_MINIMO_BUSCA` letras não filtra, porque abaixo disso o índice
   * não ajuda.
   */
  listarAcervo: async (filtros: FiltrosAcervo = {}): Promise<ItemBiblioteca[]> => {
    let consulta = supabase
      .from('library_items')
      .select(COLUNAS_ITEM)
      .order('busca', { ascending: true });

    if (filtros.categoria) {
      consulta = consulta.eq('categoria', filtros.categoria);
    }

    const termo = normalizarBusca(filtros.termo ?? '');
    if (termo.length >= TAMANHO_MINIMO_BUSCA) {
      consulta = consulta.ilike('busca', `%${termo}%`);
    }

    const { data, error } = await consulta;
    if (error) throw new Error('Não foi possível carregar o acervo da Biblioteca: ' + error.message);
    return ((data ?? []) as ItemRow[]).map(mapearItem);
  },

  /** Publica um material novo no acervo. */
  publicar: async (dados: NovoItemBiblioteca): Promise<ItemBiblioteca> => {
    const usuario = useSessionStore.getState().session?.user;
    if (!usuario) throw new Error('Sessão expirada. Entre novamente na plataforma.');

    const { data, error } = await supabase
      .from('library_items')
      .insert({ ...paraColunas(dados), created_by: usuario.id })
      .select(COLUNAS_ITEM)
      .single();
    if (error) throw new Error('Não foi possível publicar o material: ' + error.message);
    invalidarCache();
    return mapearItem(data as ItemRow);
  },

  /** Substitui os dados de um material já publicado. */
  atualizar: async (id: string, dados: NovoItemBiblioteca): Promise<ItemBiblioteca> => {
    const { data, error } = await supabase
      .from('library_items')
      .update(paraColunas(dados))
      .eq('id', id)
      .select(COLUNAS_ITEM)
      .single();
    if (error) throw new Error('Não foi possível salvar as alterações: ' + error.message);
    invalidarCache();
    return mapearItem(data as ItemRow);
  },

  /** Oculta ou reexibe um material. A RLS esconde o oculto de quem não é Administrador. */
  definirVisibilidade: async (id: string, oculto: boolean): Promise<void> => {
    const { error } = await supabase.from('library_items').update({ oculto }).eq('id', id);
    if (error) throw new Error('Não foi possível alterar a visibilidade do material: ' + error.message);
    invalidarCache();
  },

  excluir: async (item: ItemBiblioteca): Promise<void> => {
    const { error } = await supabase.from('library_items').delete().eq('id', item.id);
    if (error) throw new Error('Não foi possível excluir o material: ' + error.message);

    // A linha sai primeiro: se o Storage falhar, sobra um objeto órfão no
    // bucket, mas o acervo continua coerente para quem lê.
    if (item.arquivoCaminho) {
      const { error: erroArmazenamento } = await supabase.storage.from(BUCKET_ACERVO).remove([item.arquivoCaminho]);
      if (erroArmazenamento) {
        console.warn('[bibliotecaService] Material excluído do acervo, mas o arquivo permaneceu no armazenamento.', {
          caminho: item.arquivoCaminho,
          detalhe: erroArmazenamento.message,
        });
      }
    }
    invalidarCache();
  },

  /** Envia um PDF pela requisição simples à função de borda dedicada. */
  enviarPdf: async (
    arquivo: File,
    aoProgredir?: (percentual: number) => void,
  ): Promise<{ caminho: string; bytes: number }> => {
    if (arquivo.type && arquivo.type !== 'application/pdf') {
      throw new Error('O acervo aceita apenas arquivos PDF.');
    }
    if (arquivo.size > LIMITE_UPLOAD_PDF_BYTES) {
      throw new Error(
        `O arquivo tem ${formatarTamanhoArquivo(arquivo.size)} e o limite do acervo é ${formatarTamanhoArquivo(LIMITE_UPLOAD_PDF_BYTES)}. Otimize o PDF ou use o campo de link externo.`,
      );
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sessão expirada. Entre novamente na plataforma.');

    const leitor = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      leitor.onload = () => {
        if (typeof leitor.result === 'string') resolve(leitor.result);
        else reject(new Error('Não foi possível ler o arquivo PDF.'));
      };
      leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo PDF.'));
      leitor.readAsDataURL(arquivo);
    });
    const conteudoBase64 = dataUrl.replace(/^data:application\/pdf;base64,/, '');
    if (conteudoBase64 === dataUrl) throw new Error('Não foi possível preparar o arquivo PDF para envio.');

    aoProgredir?.(0);
    let resposta: Response;
    try {
      resposta = await fetch(URL_FUNCAO_BIBLIOTECA_UPLOAD, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ token, conteudoBase64 }),
      });
    } catch (erro) {
      throw new Error(`Não foi possível enviar o PDF: ${erro instanceof Error ? erro.message : String(erro)}`);
    }

    const texto = await resposta.text();
    let dados: unknown;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = null;
    }
    const respostaObjeto = dados && typeof dados === 'object' ? dados as Record<string, unknown> : null;
    const motivo = typeof respostaObjeto?.motivo === 'string'
      ? respostaObjeto.motivo
      : typeof respostaObjeto?.message === 'string'
        ? respostaObjeto.message
        : 'Resposta inválida da função de upload.';
    if (!resposta.ok || respostaObjeto?.ok !== true) {
      throw new Error(`Não foi possível enviar o PDF (${resposta.status}): ${motivo}`);
    }
    if (typeof respostaObjeto.caminho !== 'string' || typeof respostaObjeto.bytes !== 'number') {
      throw new Error(`Não foi possível enviar o PDF (${resposta.status}): resposta inválida da função de upload.`);
    }

    aoProgredir?.(100);
    return { caminho: respostaObjeto.caminho, bytes: respostaObjeto.bytes };
  },

  /** Descarta um PDF que subiu mas cujo material não chegou a ser publicado. */
  descartarArquivo: async (caminho: string): Promise<void> => {
    const { error } = await supabase.storage.from(BUCKET_ACERVO).remove([caminho]);
    if (error) {
      console.warn('[bibliotecaService] Não foi possível descartar o arquivo enviado.', {
        caminho,
        detalhe: error.message,
      });
    }
  },

  /** URL assinada de leitura: o bucket é privado e a URL expira. */
  assinarArquivo: async (caminho: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(BUCKET_ACERVO)
      .createSignedUrl(caminho, VALIDADE_URL_ASSINADA_SEGUNDOS);
    if (error || !data?.signedUrl) {
      throw new Error(
        'Não foi possível liberar o arquivo para leitura: ' + (error?.message ?? 'o armazenamento não devolveu a URL.'),
      );
    }
    return data.signedUrl;
  },

  invalidarCache,
};

export default bibliotecaService;
