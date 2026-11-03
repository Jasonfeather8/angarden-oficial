import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);
const EXTENSOES_POR_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

/**
 * O navegador só envia o POST depois que o preflight (OPTIONS) é aceito, e a
 * resposta precisa declarar o método e todos os cabeçalhos que o cliente manda.
 * Faltava `Access-Control-Allow-Methods`, então o preflight era recusado, o POST
 * nunca saía do navegador e a falha chegava apenas como "Failed to send a request
 * to the Edge Function". A lista de cabeçalhos é a canônica do SDK
 * (@supabase/supabase-js/cors), que acompanha o que o cliente envia.
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-retry-count, traceparent, tracestate, baggage',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function validarCaminho(caminho: unknown): string[] | null {
  if (typeof caminho !== 'string' || caminho.includes('..') || caminho.includes('\\')
    || caminho.startsWith('/') || caminho.endsWith('/')) return null;

  const segmentos = caminho.split('/');
  if (segmentos.length < 2 || segmentos.some((segmento) => segmento.length === 0)) return null;

  const nomeArquivo = segmentos[segmentos.length - 1];
  const ponto = nomeArquivo.lastIndexOf('.');
  if (ponto <= 0 || ponto === nomeArquivo.length - 1 || nomeArquivo.includes('/')) return null;
  return segmentos;
}

function decodificarBase64(conteudoBase64: unknown): Uint8Array | null {
  if (typeof conteudoBase64 !== 'string' || conteudoBase64.length === 0
    || conteudoBase64.length > Math.ceil(MAX_BYTES / 3) * 4
    || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(conteudoBase64)) return null;

  try {
    const binario = atob(conteudoBase64);
    if (binario.length > MAX_BYTES) return null;
    return Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  } catch {
    return null;
  }
}

async function subirBytes(segmentos: string[], mime: string, bytes: Uint8Array) {
  const caminhoCodificado = segmentos.map(encodeURIComponent).join('/');
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/midia/${caminhoCodificado}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      'content-type': mime,
      'cache-control': 'max-age=31536000',
      'x-upsert': 'false',
    },
    body: bytes,
  });
  const detalhe = response.ok ? null : await response.text();
  return {
    response,
    detalhe,
    url: `${SUPABASE_URL}/storage/v1/object/public/midia/${caminhoCodificado}`,
  };
}

async function caminhoDeterministicoDaMagia(id: string, mime: string): Promise<string> {
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${id}:${mime}`)));
  const hex = Array.from(hash.slice(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join('');
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  return `grimorio/${uuid}.${EXTENSOES_POR_MIME[mime]}`;
}

async function migrarLoteGrimorio(serviceClient: ReturnType<typeof createClient>, limite: number) {
  try {
    const { data: rows, error: selectError } = await serviceClient
      .from('grimorio_spells')
      .select('id, dados')
      .gt('imagem_bytes', 2000)
      .like('dados->>image', 'data:image%')
      .limit(limite);
    if (selectError) return { ok: false, motivo: `Não foi possível buscar magias pendentes: ${selectError.message}` };

    let processados = 0;
    let convertidas = 0;
    const falhas: string[] = [];

    for (const row of rows ?? []) {
      const dados = row.dados;
      const image = dados && typeof dados === 'object' && !Array.isArray(dados)
        ? (dados as Record<string, unknown>).image
        : undefined;
      if (typeof image !== 'string' || !image.startsWith('data:image')) continue;

      processados += 1;
      const correspondencia = image.match(/^data:(image\/[^;,]+)(?:;[^,]*)?;base64,([\s\S]*)$/i);
      if (!correspondencia) {
        falhas.push(`Magia ${row.id}: data URL inválida ou não codificada em base64.`);
        continue;
      }

      const mime = correspondencia[1].toLowerCase();
      if (!ALLOWED_MIMES.has(mime)) {
        falhas.push(`Magia ${row.id}: tipo de imagem não permitido (${mime}).`);
        continue;
      }
      const bytes = decodificarBase64(correspondencia[2]);
      if (!bytes) {
        falhas.push(`Magia ${row.id}: conteúdo base64 inválido ou imagem maior que 5 MB.`);
        continue;
      }

      try {
        const caminho = await caminhoDeterministicoDaMagia(String(row.id), mime);
        const upload = await subirBytes(caminho.split('/'), mime, bytes);
        if (!upload.response.ok && upload.response.status !== 409) {
          falhas.push(`Magia ${row.id}: Storage recusou o upload (${upload.response.status} ${upload.detalhe ?? ''}).`.trim());
          continue;
        }

        const { error: updateError } = await serviceClient
          .from('grimorio_spells')
          .update({ dados: { ...(dados as Record<string, unknown>), image: upload.url } })
          .eq('id', row.id);
        if (updateError) {
          falhas.push(`Magia ${row.id}: não foi possível gravar a URL no Grimório: ${updateError.message}`);
          continue;
        }
        convertidas += 1;
      } catch (error) {
        falhas.push(`Magia ${row.id}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const { count, error: countError } = await serviceClient
      .from('grimorio_spells')
      .select('id', { count: 'exact', head: true })
      .gt('imagem_bytes', 2000)
      .like('dados->>image', 'data:image%');
    if (countError) return { ok: false, motivo: `Não foi possível contar magias pendentes: ${countError.message}` };

    // Falha de uma magia isolada não invalida o lote: o cliente continua
    // convertendo as demais e exibe as falhas no fim. `ok: false` fica reservado
    // para falhas estruturais (busca, contagem ou exceção inesperada).
    const restantes = count ?? 0;
    return { ok: true, processados, convertidas, restantes, falhas };
  } catch (error) {
    return { ok: false, motivo: error instanceof Error ? error.message : String(error) };
  }
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    const solicitados = request.headers.get('Access-Control-Request-Headers');
    return new Response(null, {
      status: 204,
      headers: solicitados
        ? { ...corsHeaders, 'Access-Control-Allow-Headers': solicitados }
        : corsHeaders,
    });
  }
  if (request.method !== 'POST') return jsonResponse(405, { motivo: 'Método não permitido.' });

  try {
    const authorization = request.headers.get('Authorization');
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return jsonResponse(401, { motivo: 'Autenticação necessária.' });

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    let userId: string | undefined;
    try {
      const { data, error } = await authClient.auth.getClaims(token);
      if (!error && typeof data?.claims?.sub === 'string') userId = data.claims.sub;
    } catch (error) {
      console.warn('[midia-upload] Falha ao verificar claims; tentando getUser.', error);
    }

    if (!userId) {
      try {
        const { data, error } = await authClient.auth.getUser(token);
        if (!error) userId = data.user?.id;
      } catch (error) {
        console.warn('[midia-upload] Falha na verificação alternativa do usuário.', error);
      }
    }
    if (!userId) return jsonResponse(401, { motivo: 'Token inválido ou usuário não autenticado.' });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResponse(400, { motivo: 'Corpo JSON inválido.' });
    }
    if (!body || typeof body !== 'object') return jsonResponse(400, { motivo: 'Corpo da requisição inválido.' });

    const entrada = body as Record<string, unknown>;
    const modoLote = entrada.modo === 'lote-grimorio';
    let limite = 8;
    if (modoLote && entrada.limite !== undefined) {
      if (typeof entrada.limite !== 'number' || !Number.isFinite(entrada.limite) || !Number.isInteger(entrada.limite) || entrada.limite < 1) {
        return jsonResponse(400, { ok: false, motivo: 'O limite do lote deve ser um número inteiro maior que zero.' });
      }
      limite = Math.min(entrada.limite, 20);
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, role, status, tenant_id')
      .eq('id', userId)
      .maybeSingle();
    if (profileError || !profile || profile.status !== 'ativo') {
      return jsonResponse(403, { motivo: 'Conta sem autorização para enviar imagens.' });
    }

    if (modoLote) {
      if (profile.role !== 'admin') {
        return jsonResponse(403, { ok: false, motivo: 'A migração em lote do Grimório é exclusiva do Administrador da plataforma.' });
      }
      return jsonResponse(200, await migrarLoteGrimorio(serviceClient, limite));
    }

    const segmentos = validarCaminho(entrada.caminho);
    if (!segmentos) return jsonResponse(400, { motivo: 'Caminho de arquivo inválido.' });
    if (typeof entrada.mime !== 'string' || !ALLOWED_MIMES.has(entrada.mime)) {
      return jsonResponse(400, { motivo: 'Tipo de imagem não permitido.' });
    }
    const bytes = decodificarBase64(entrada.conteudoBase64);
    if (!bytes) return jsonResponse(400, { motivo: 'Conteúdo base64 inválido ou imagem maior que 5 MB.' });

    const pasta = segmentos[0];
    const autorizado = (pasta === 'grimorio' || pasta === 'mercado')
      ? profile.role === 'admin'
      : pasta === profile.id || (typeof profile.tenant_id === 'string' && pasta === profile.tenant_id);
    if (!autorizado) return jsonResponse(403, { motivo: 'Você não tem autorização para enviar imagens nesta pasta.' });

    const upload = await subirBytes(segmentos, entrada.mime, bytes);
    if (!upload.response.ok) {
      console.error('[midia-upload] Storage rejeitou o upload.', upload.response.status, upload.detalhe);
      return jsonResponse(200, { ok: false, detalhe: `${upload.response.status} ${upload.detalhe ?? ''}`.trim() });
    }

    return jsonResponse(200, { ok: true, url: upload.url });
  } catch (error) {
    console.error('[midia-upload] Falha inesperada ao processar o upload.', error);
    return jsonResponse(500, { motivo: 'Falha inesperada ao enviar a imagem.' });
  }
});
