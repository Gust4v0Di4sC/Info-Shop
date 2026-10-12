import {
  createMelhorEnvioAuthorization,
  refreshMelhorEnvioTokenIfNeeded,
  requiredEnv,
  saveTokenFromOAuth,
} from '../_shared/melhor-envio.ts';
import { corsHeadersForRequest, isCorsAllowed, jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createLogContext, logCompleted, logError } from '../_shared/observability.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  const logContext = createLogContext(req, 'melhor-envio-auth');

  try {
    const cronSecret = req.headers.get('x-cron-secret');
    if (req.method === 'POST' && cronSecret) {
      if (!await secretsMatch(cronSecret, requiredEnv('ME_CRON_SECRET'))) {
        logCompleted(logContext, 'TOKEN_REFRESH_UNAUTHORIZED', 401, { provider: 'melhor-envio' });
        return jsonResponse({ message: 'Nao autorizado.' }, 401, req);
      }

      const tokenStatus = await refreshMelhorEnvioTokenIfNeeded();
      logCompleted(logContext, 'TOKEN_REFRESH_COMPLETED', 200, {
        provider: 'melhor-envio',
        tokenStatus,
      });
      return jsonResponse({ ok: true, status: tokenStatus }, 200, req);
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const providerError = url.searchParams.get('error');

    if (req.method === 'GET' && providerError) {
      throw new Error('A autorizacao foi cancelada ou recusada no Melhor Envio.');
    }

    if (req.method === 'GET' && code && state) {
      await saveTokenFromOAuth(code, state);
      logCompleted(logContext, 'OAUTH_TOKEN_SAVED', 200, { provider: 'melhor-envio' });
      return htmlResponse(
        '<h1>Melhor Envio autorizado.</h1><p>A renovacao automatica esta ativa. Voce ja pode fechar esta aba.</p>',
        req,
      );
    }

    if (req.method === 'GET') {
      return jsonResponse({ message: 'Callback OAuth incompleto.' }, 400, req);
    }

    if (req.method !== 'POST') {
      return jsonResponse({ message: 'Metodo nao permitido.' }, 405, req);
    }

    if (!isCorsAllowed(req)) {
      return jsonResponse({ message: 'Origem nao permitida.' }, 403, req);
    }

    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) {
      return jsonResponse({ message: 'Entre como gerente para autorizar o Melhor Envio.' }, 401, req);
    }

    const authorizationUrl = await createMelhorEnvioAuthorization(authHeader);
    logCompleted(logContext, 'OAUTH_REDIRECT_CREATED', 200, { provider: 'melhor-envio' });
    return jsonResponse({ authorizationUrl }, 200, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha na autorizacao.';
    const status = errorStatus(message);
    logError(logContext, 'OAUTH_AUTHORIZATION_FAILED', error, {
      status,
      provider: 'melhor-envio',
    });
    return req.method === 'GET'
      ? htmlResponse(`<h1>Nao foi possivel autorizar.</h1><p>${escapeHtml(message)}</p>`, req, status)
      : jsonResponse({ message }, status, req);
  }
});

function errorStatus(message: string): number {
  if (message.includes('Apenas gerentes')) {
    return 403;
  }
  if (message.includes('Reautorize')) {
    return 409;
  }
  if (message.includes('Sessao') || message.includes('Entre como gerente')) {
    return 401;
  }
  if (
    message.includes('autorizacao expirou') ||
    message.includes('autorizacao foi cancelada') ||
    message.includes('State OAuth')
  ) {
    return 400;
  }
  return 500;
}

function htmlResponse(content: string, req: Request, status = 200): Response {
  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Melhor Envio</title></head><body>${content}</body></html>`, {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'",
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character);
}

async function secretsMatch(provided: string, expected: string): Promise<boolean> {
  if (!provided || !expected) {
    return false;
  }

  const [providedDigest, expectedDigest] = await Promise.all([
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(provided)),
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(expected)),
  ]);
  const providedBytes = new Uint8Array(providedDigest);
  const expectedBytes = new Uint8Array(expectedDigest);
  let difference = 0;

  for (let index = 0; index < providedBytes.length; index++) {
    difference |= providedBytes[index] ^ expectedBytes[index];
  }

  return difference === 0;
}
