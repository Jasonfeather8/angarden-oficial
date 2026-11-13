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
 * Endpoint retomável (TUS) documentado no domínio principal da API. O upload
 * padrão do SDK manda o arquivo inteiro numa única requisição e falhava com um
 * manual de 10 MB; aqui o envio é fatiado e retomado de onde parou.
 */
const URL_UPLOAD_RESUMIVEL =
  'https://qmwrpcyzcmmjrjzsorgx.supabase.co/storage/v1/upload/resumable';

/** Tamanho da parte: o Storage exige exatamente 6 MB no envio retomável. */
const TAMANHO_PEDACO_BYTES = 6 * 1024 * 1024;

async function erroUpload(resposta?: Response, erro?: unknown): Promise<Error> {
  const diagnostico: string[] = resposta ? [`HTTP ${resposta.status}`] : [];
  for (const nome of ['server', 'cf-ray', 'content-type', 'content-length']) {
    const valor = resposta?.headers.get(nome);
    if (valor) diagnostico.push(`${nome}: ${valor}`);
  }
  const corpo = resposta ? (await resposta.text()).slice(0, 300) : '';
  const detalheErro = erro instanceof Error ? erro.message : String(erro ?? 'Falha de rede.');
  const contexto = [diagnostico.join(' · '), corpo].filter(Boolean).join(' — ');
  return new Error(`Não foi possível enviar o PDF: ${contexto || `Falha de rede — ${detalheErro}`}`);
}

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
   * serve para um manual. O envio é fatiado em partes de 6 MB e retomado de onde
   * parou; usa `fetch` porque requisições XHR com corpo falham no ambiente de
   * prévia, enquanto o envio retomável permite sincronizar o avanço com o Storage.
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
    const metadados = [
      ['bucketName', BUCKET_ACERVO],
      ['objectName', caminho],
      ['contentType', 'application/pdf'],
      ['cacheControl', '3600'],
    ]
      .map(([chave, valor]) => `${chave} ${btoa(valor)}`)
      .join(',');

    const criarResposta = await (async () => {
      try {
        return await fetch(URL_UPLOAD_RESUMIVEL, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'x-upsert': 'true',
            'tus-resumable': '1.0.0',
            'upload-length': String(arquivo.size),
            'upload-metadata': metadados,
          },
        });
      } catch (erro) {
        throw await erroUpload(undefined, erro);
      }
    })();

    if (!criarResposta.ok) throw await erroUpload(criarResposta);
    const location = criarResposta.headers.get('location');
    if (!location) throw new Error('O Storage não informou o endereço do envio retomável.');
    const enderecoEnvio = new URL(location, URL_UPLOAD_RESUMIVEL).href;

    let deslocamento = 0;
    while (deslocamento < arquivo.size) {
      let parteConcluida = false;
      let ultimoErro: Error | undefined;

      for (let tentativa = 0; tentativa < 3 && !parteConcluida; tentativa += 1) {
        const parte = arquivo.slice(deslocamento, deslocamento + TAMANHO_PEDACO_BYTES);
        try {
          let resposta: Response;
          try {
            resposta = await fetch(enderecoEnvio, {
              method: 'PATCH',
              headers: {
                authorization: `Bearer ${token}`,
                'tus-resumable': '1.0.0',
                'upload-offset': String(deslocamento),
                'content-type': 'application/offset+octet-stream',
              },
              body: parte,
            });
          } catch (erro) {
            throw await erroUpload(undefined, erro);
          }
          if (!resposta.ok) throw await erroUpload(resposta);

          const offsetResposta = Number(resposta.headers.get('upload-offset'));
          deslocamento =
            Number.isFinite(offsetResposta) && offsetResposta > deslocamento
              ? offsetResposta
              : deslocamento + parte.size;
          parteConcluida = true;
          aoProgredir?.(Math.round((deslocamento / arquivo.size) * 100));
        } catch (erro) {
          ultimoErro = erro instanceof Error ? erro : await erroUpload(undefined, erro);
          if (tentativa === 2) break;

          await new Promise((resolver) => setTimeout(resolver, tentativa === 0 ? 1000 : 3000));
          try {
            let sincronizacao: Response;
            try {
              sincronizacao = await fetch(enderecoEnvio, {
                method: 'HEAD',
                headers: { authorization: `Bearer ${token}`, 'tus-resumable': '1.0.0' },
              });
            } catch (erroSincronizacao) {
              throw await erroUpload(undefined, erroSincronizacao);
            }
            if (!sincronizacao.ok) throw await erroUpload(sincronizacao);
            const offsetSincronizado = Number(sincronizacao.headers.get('upload-offset'));
            if (Number.isFinite(offsetSincronizado) && offsetSincronizado >= deslocamento) {
              deslocamento = offsetSincronizado;
            }
            if (deslocamento >= arquivo.size) {
              parteConcluida = true;
              aoProgredir?.(Math.round((deslocamento / arquivo.size) * 100));
            }
          } catch (erroSincronizacao) {
            throw erroSincronizacao instanceof Error
              ? erroSincronizacao
              : await erroUpload(undefined, erroSincronizacao);
          }
        }
      }

      if (!parteConcluida) throw ultimoErro ?? new Error('O envio retomável falhou.');
    }

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
