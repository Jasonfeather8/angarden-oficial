import { formatarTamanhoArquivo, LIMITE_UPLOAD_PDF_BYTES } from '../config/biblioteca';
import { invalidateAsyncDataCache } from '../hooks/useAsyncData';
import { supabase } from '../integrations/supabase/client';
import { useSessionStore } from '../store/useSessionStore';
import type { EntradaIndiceBiblioteca, ItemBiblioteca, NovoItemBiblioteca } from '../types';
import { normalizarBusca, TAMANHO_MINIMO_BUSCA } from '../utils/normalizarBusca';
import { cacheKeyPrefixes } from './cacheKeys';

/** Bucket PRIVADO do acervo: guarda só PDF e é lido por URL assinada. */
const BUCKET_ACERVO = 'biblioteca';

/** Validade da URL assinada, suficiente para uma sessão inteira de leitura. */
const VALIDADE_URL_ASSINADA_SEGUNDOS = 60 * 60;

/**
 * Endpoint retomável (TUS) do Storage, no host direto do serviço — é o que a
 * documentação exige para este caminho. O upload padrão do SDK manda o arquivo
 * inteiro numa única requisição e falhava com um manual de 10 MB; aqui o envio
 * é fatiado e retomado de onde parou.
 */
const URL_UPLOAD_RESUMIVEL =
  'https://qmwrpcyzcmmjrjzsorgx.storage.supabase.co/storage/v1/upload/resumable';

/** Tamanho da parte: o Storage exige exatamente 6 MB no envio retomável. */
const TAMANHO_PEDACO_BYTES = 6 * 1024 * 1024;

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

  /**
   * Envia o PDF direto ao bucket pelo endpoint retomável (TUS), sem passar pela
   * função de borda de mídia: aquela limita a 5 MB e trafega base64, o que não
   * serve para um manual. O envio é fatiado em partes de 6 MB, retomado de onde
   * parou, e o Storage devolve a causa real quando recusa. O `tus-js-client`
   * entra por `import()` para não pesar a rota administrativa.
   */
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

    const caminho = `${crypto.randomUUID()}.pdf`;
    const { Upload } = await import('tus-js-client');

    await new Promise<void>((resolver, rejeitar) => {
      const envio = new Upload(arquivo, {
        endpoint: URL_UPLOAD_RESUMIVEL,
        headers: { authorization: `Bearer ${token}`, 'x-upsert': 'true' },
        chunkSize: TAMANHO_PEDACO_BYTES,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: BUCKET_ACERVO,
          objectName: caminho,
          contentType: 'application/pdf',
          cacheControl: '3600',
        },
        onProgress: (enviados, total) => {
          if (aoProgredir && total > 0) aoProgredir(Math.round((enviados / total) * 100));
        },
        onError: (erro) => {
          // O corpo da resposta traz a causa (MIME, teto, política); sem ele a
          // falha volta como a mensagem genérica do protocolo.
          const detalhe = 'originalResponse' in erro ? erro.originalResponse?.getBody() : undefined;
          rejeitar(
            new Error(
              `Não foi possível enviar o PDF: ${detalhe || erro.message || 'o envio retomável falhou.'}`,
            ),
          );
        },
        onSuccess: () => resolver(),
      });
      envio.start();
    });

    return { caminho, bytes: arquivo.size };
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
