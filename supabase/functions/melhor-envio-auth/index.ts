import { buildAuthorizeUrl, saveTokenFromOAuth } from '../_shared/melhor-envio.ts';
import { corsHeaders, jsonResponse, optionsResponse } from '../_shared/cors.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse();
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');

    if (code) {
      await saveTokenFromOAuth(code);
      return new Response('<html><body><h1>Melhor Envio autorizado.</h1><p>Voce ja pode fechar esta aba.</p></body></html>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    const state = crypto.randomUUID();
    return Response.redirect(buildAuthorizeUrl(state), 302);
  } catch (error) {
    return jsonResponse({ message: error instanceof Error ? error.message : 'Falha na autorizacao.' }, 500);
  }
});
