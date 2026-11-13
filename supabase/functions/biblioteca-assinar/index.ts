import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.118.0';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
    console.warn('[biblioteca-assinar] Método não permitido.', request.method);
    return jsonResponse(405, { ok: false, motivo: 'Método não permitido.' });
  }

  try {
    let body: unknown;
    try {
      const texto = await request.text();
      body = texto ? JSON.parse(texto) : null;
    } catch {
      console.warn('[biblioteca-assinar] Corpo JSON inválido.');
      return jsonResponse(400, { ok: false, motivo: 'Corpo JSON inválido.' });
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      console.warn('[biblioteca-assinar] Corpo da requisição inválido.');
      return jsonResponse(400, { ok: false, motivo: 'Corpo da requisição inválido.' });
    }

    const entrada = body as Record<string, unknown>;
    const authorization = request.headers.get('Authorization');
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
      ?? (typeof entrada.token === 'string' ? entrada.token : undefined);
    console.log('[biblioteca-assinar] Requisição recebida.', { temToken: Boolean(token) });
    if (!token) {
      console.warn('[biblioteca-assinar] Autenticação ausente.');
      return jsonResponse(401, { ok: false, motivo: 'Autenticação necessária.' });
    }

    const caminho = entrada.caminho;
    if (
      typeof caminho !== 'string' ||
      caminho.includes('..') ||
      caminho.includes('\\') ||
      caminho.startsWith('/') ||
      caminho.endsWith('/') ||
      caminho.includes('/') ||
      !caminho.endsWith('.pdf')
    ) {
      console.warn('[biblioteca-assinar] Caminho de PDF inválido.');
      return jsonResponse(400, { ok: false, motivo: 'Caminho de PDF inválido.' });
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    let userId: string | undefined;
    try {
      const { data, error } = await authClient.auth.getClaims(token);
      if (!error && typeof data?.claims?.sub === 'string') userId = data.claims.sub;
    } catch (error) {
      console.warn('[biblioteca-assinar] Falha ao verificar claims; tentando getUser.', error);
    }

    if (!userId) {
      try {
        const { data, error } = await authClient.auth.getUser(token);
        if (!error) userId = data.user?.id;
      } catch (error) {
        console.warn('[biblioteca-assinar] Falha na verificação alternativa do usuário.', error);
      }
    }
    if (!userId) {
      console.warn('[biblioteca-assinar] Token inválido ou usuário não autenticado.');
      return jsonResponse(401, { ok: false, motivo: 'Token inválido ou usuário não autenticado.' });
    }

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .maybeSingle();
    if (profileError) {
      console.error('[biblioteca-assinar] Falha ao consultar o perfil.', profileError.message);
      return jsonResponse(500, { ok: false, motivo: 'Não foi possível verificar a autorização da conta.' });
    }
    if (!profile || profile.status !== 'ativo') {
      console.warn('[biblioteca-assinar] Conta inativa ou sem perfil.', { userId });
      return jsonResponse(403, { ok: false, motivo: 'A leitura do acervo exige uma conta ativa.' });
    }

    const { data, error } = await serviceClient.storage
      .from('biblioteca')
      .createSignedUrl(caminho, 3600);
    if (error || !data?.signedUrl) {
      console.error('[biblioteca-assinar] Storage recusou a assinatura da URL.', error?.message);
      return jsonResponse(502, { ok: false, motivo: error?.message ?? 'O armazenamento não devolveu a URL assinada.' });
    }

    console.log('[biblioteca-assinar] URL assinada gerada.', { caminho });
    return jsonResponse(200, { ok: true, url: data.signedUrl });
  } catch (error) {
    console.error('[biblioteca-assinar] Falha inesperada ao assinar a URL.', error);
    return jsonResponse(500, { ok: false, motivo: 'Falha inesperada ao liberar o arquivo para leitura.' });
  }
});
