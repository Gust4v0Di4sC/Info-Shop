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

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  if (req.method !== 'POST') {
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405, req);
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const user = await getAuthenticatedUser(authHeader);
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
    const quotes = await calculateQuotes(cart, address);
    return jsonResponse({ quotes }, 200, req);
  } catch (error) {
    return jsonResponse({ message: error instanceof Error ? error.message : 'Nao foi possivel calcular frete.' }, 400, req);
  }
});
