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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
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
    const segmentos = validarCaminho(entrada.caminho);
    if (!segmentos) return jsonResponse(400, { motivo: 'Caminho de arquivo inválido.' });
    if (typeof entrada.mime !== 'string' || !ALLOWED_MIMES.has(entrada.mime)) {
      return jsonResponse(400, { motivo: 'Tipo de imagem não permitido.' });
    }
    const bytes = decodificarBase64(entrada.conteudoBase64);
    if (!bytes) return jsonResponse(400, { motivo: 'Conteúdo base64 inválido ou imagem maior que 5 MB.' });

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

    const pasta = segmentos[0];
    const autorizado = (pasta === 'grimorio' || pasta === 'mercado')
      ? profile.role === 'admin'
      : pasta === profile.id || (typeof profile.tenant_id === 'string' && pasta === profile.tenant_id);
    if (!autorizado) return jsonResponse(403, { motivo: 'Você não tem autorização para enviar imagens nesta pasta.' });

    const storageUrl = `${SUPABASE_URL}/storage/v1/object/midia/${segmentos.map(encodeURIComponent).join('/')}`;
    const storageResponse = await fetch(storageUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        'content-type': entrada.mime,
        'cache-control': 'max-age=31536000',
        'x-upsert': 'false',
      },
      body: bytes,
    });

    if (!storageResponse.ok) {
      const corpo = await storageResponse.text();
      console.error('[midia-upload] Storage rejeitou o upload.', storageResponse.status, corpo);
      return jsonResponse(200, { ok: false, detalhe: `${storageResponse.status} ${corpo}` });
    }

    const url = `${SUPABASE_URL}/storage/v1/object/public/midia/${segmentos.map(encodeURIComponent).join('/')}`;
    return jsonResponse(200, { ok: true, url });
  } catch (error) {
    console.error('[midia-upload] Falha inesperada ao processar o upload.', error);
    return jsonResponse(500, { motivo: 'Falha inesperada ao enviar a imagem.' });
  }
});
