import { buildAuthorizeUrl, saveTokenFromOAuth } from '../_shared/melhor-envio.ts';
import { corsHeadersForRequest, jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createLogContext, logCompleted, logError } from '../_shared/observability.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  const logContext = createLogContext(req, 'melhor-envio-auth');

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (code) {
      await saveTokenFromOAuth(code);
      logCompleted(logContext, 'OAUTH_TOKEN_SAVED', 200, { provider: 'melhor-envio' });
      return new Response('<html><body><h1>Melhor Envio autorizado.</h1><p>Voce ja pode fechar esta aba.</p></body></html>', {
        headers: { ...corsHeadersForRequest(req), 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const state = crypto.randomUUID();
    logCompleted(logContext, 'OAUTH_REDIRECT_CREATED', 302, { provider: 'melhor-envio' });
    return Response.redirect(buildAuthorizeUrl(state), 302);
  } catch (error) {
    logError(logContext, 'OAUTH_AUTHORIZATION_FAILED', error, {
      status: 500,
      provider: 'melhor-envio',
    });
    return jsonResponse({ message: error instanceof Error ? error.message : 'Falha na autorizacao.' }, 500, req);
  }
});
