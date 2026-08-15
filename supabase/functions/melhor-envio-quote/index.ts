import {
  DeliveryAddress,
  calculateQuotes,
  getAuthenticatedUser,
  getServiceClient,
  loadCartForUser,
  normalizeAddress,
} from '../_shared/melhor-envio.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { assertRateLimit } from '../_shared/rate-limit.ts';
import { createLogContext, logCompleted, logError, logInfo } from '../_shared/observability.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  const logContext = createLogContext(req, 'melhor-envio-quote');

  if (req.method !== 'POST') {
    logCompleted(logContext, 'METHOD_NOT_ALLOWED', 405, { method: req.method, provider: 'melhor-envio' });
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405, req);
  }

  let userId = '';

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const user = await getAuthenticatedUser(authHeader);
    userId = user.id;
    const serviceClient = getServiceClient();
    await assertRateLimit(serviceClient, {
      scope: 'melhor-envio-quote',
      subject: user.id,
      maxRequests: 30,
      windowSeconds: 600,
    });
    const body = await req.json() as { address: DeliveryAddress };
    const address = normalizeAddress(body.address);
    const cart = await loadCartForUser(serviceClient, user);
    logInfo(logContext, 'SHIPPING_QUOTE_STARTED', { userId, provider: 'melhor-envio' });
    const quotes = await calculateQuotes(cart, address);
    logCompleted(logContext, 'SHIPPING_QUOTE_CREATED', 200, {
      userId,
      provider: 'melhor-envio',
      quoteCount: quotes.length,
    });
    return jsonResponse({ quotes }, 200, req);
  } catch (error) {
    logError(logContext, 'SHIPPING_QUOTE_FAILED', error, {
      userId,
      status: 400,
      provider: 'melhor-envio',
    });
    return jsonResponse({ message: error instanceof Error ? error.message : 'Nao foi possivel calcular frete.' }, 400, req);
  }
});
