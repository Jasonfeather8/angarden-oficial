import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MAX_BYTES = 20 * 1024 * 1024;
/** Teto do base64 correspondente ao limite de PDF, já contando o padding. */
const MAX_BASE64 = Math.ceil(MAX_BYTES / 3) * 4;
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

/**
 * Decodifica o base64 recebido no corpo. A checagem é por tamanho e pela
 * própria decodificação: um regex sobre a string inteira (dezenas de
 * megabytes) estoura a pilha do isolate da função.
 */
function decodificarPdf(conteudoBase64: unknown): Uint8Array | null {
  if (
    typeof conteudoBase64 !== 'string' ||
    conteudoBase64.length === 0 ||
    conteudoBase64.length > MAX_BASE64 ||
    conteudoBase64.length % 4 !== 0
  ) return null;

  try {
    // O `atob` já recusa caractere fora do alfabeto base64 e padding inválido.
    const binario = atob(conteudoBase64);
    if (binario.length === 0 || binario.length > MAX_BYTES || !binario.startsWith('%PDF-')) return null;

    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
    return bytes;
  } catch {
    return null;
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
  if (request.method !== 'POST') {
    console.warn('[biblioteca-upload] Método não permitido.', request.method);
    return jsonResponse(405, { ok: false, motivo: 'Método não permitido.' });
  }

  try {
    let body: unknown;
    try {
      const texto = await request.text();
      body = texto ? JSON.parse(texto) : null;
    } catch {
      console.warn('[biblioteca-upload] Corpo JSON inválido.');
      return jsonResponse(400, { ok: false, motivo: 'Corpo JSON inválido.' });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      console.warn('[biblioteca-upload] Corpo da requisição inválido.');
      return jsonResponse(400, { ok: false, motivo: 'Corpo da requisição inválido.' });
    }
    const entrada = body as Record<string, unknown>;
    const authorization = request.headers.get('Authorization');
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
      ?? (typeof entrada.token === 'string' ? entrada.token : undefined);
    console.log('[biblioteca-upload] Requisição recebida.', { temToken: Boolean(token) });
    if (!token) {
      console.warn('[biblioteca-upload] Autenticação ausente.');
      return jsonResponse(401, { ok: false, motivo: 'Autenticação necessária.' });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    let userId: string | undefined;
    try {
      const { data, error } = await authClient.auth.getClaims(token);
      if (!error && typeof data?.claims?.sub === 'string') userId = data.claims.sub;
    } catch (error) {
      console.warn('[biblioteca-upload] Falha ao verificar claims; tentando getUser.', error);
    }

    if (!userId) {
      try {
        const { data, error } = await authClient.auth.getUser(token);
        if (!error) userId = data.user?.id;
      } catch (error) {
        console.warn('[biblioteca-upload] Falha na verificação alternativa do usuário.', error);
      }
    }
    if (!userId) {
      console.warn('[biblioteca-upload] Token inválido ou usuário não autenticado.');
      return jsonResponse(401, { ok: false, motivo: 'Token inválido ou usuário não autenticado.' });
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role, status')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) {
      console.error('[biblioteca-upload] Falha ao consultar o perfil.', profileError.message);
      return jsonResponse(500, { ok: false, motivo: 'Não foi possível verificar a autorização da conta.' });
    }
    if (!profile || profile.status !== 'ativo' || profile.role !== 'admin') {
      console.warn('[biblioteca-upload] Conta sem autorização para publicar no acervo.', { userId });
      return jsonResponse(403, { ok: false, motivo: 'A publicação no acervo é exclusiva do Administrador da plataforma.' });
    }

    const conteudoBase64 = entrada.conteudoBase64;
    if (typeof conteudoBase64 !== 'string' || conteudoBase64.length === 0) {
      console.warn('[biblioteca-upload] Corpo sem conteúdo de PDF.');
      return jsonResponse(400, { ok: false, motivo: 'Envie o conteúdo do PDF no campo conteudoBase64.' });
    }
    if (conteudoBase64.length > MAX_BASE64) {
      console.warn('[biblioteca-upload] PDF acima do limite do acervo.', { caracteres: conteudoBase64.length });
      return jsonResponse(413, { ok: false, motivo: 'O PDF excede o limite de 20 MB do acervo.' });
    }

    const bytes = decodificarPdf(conteudoBase64);
    if (!bytes) {
      console.warn('[biblioteca-upload] PDF inválido ou malformado.', { caracteres: conteudoBase64.length });
      return jsonResponse(400, { ok: false, motivo: 'O arquivo está corrompido ou não é um PDF válido.' });
    }

    const caminho = `${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await serviceClient.storage
      .from('biblioteca')
      .upload(caminho, bytes, { contentType: 'application/pdf', upsert: false });
    if (uploadError) {
      console.error('[biblioteca-upload] Storage recusou o upload.', uploadError.message);
      return jsonResponse(502, { ok: false, motivo: 'O armazenamento recusou o PDF.' });
    }

    console.log('[biblioteca-upload] PDF enviado ao bucket privado.', { caminho, bytes: bytes.byteLength });
    return jsonResponse(200, { ok: true, caminho, bytes: bytes.byteLength });
  } catch (error) {
    console.error('[biblioteca-upload] Falha inesperada ao processar o upload.', error);
    return jsonResponse(500, { ok: false, motivo: 'Falha inesperada ao enviar o PDF.' });
  }
});
