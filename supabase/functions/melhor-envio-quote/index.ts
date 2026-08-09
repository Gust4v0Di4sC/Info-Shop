import {
  DeliveryAddress,
  calculateQuotes,
  getAuthenticatedUser,
  getServiceClient,
  loadCartForUser,
  normalizeAddress,
} from '../_shared/melhor-envio.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (req.method !== 'POST') {
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405);
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const user = await getAuthenticatedUser(authHeader);
    const body = await req.json() as { address: DeliveryAddress };
    const address = normalizeAddress(body.address);
    const cart = await loadCartForUser(getServiceClient(), user);
    const quotes = await calculateQuotes(cart, address);
    return jsonResponse({ quotes });
  } catch (error) {
    return jsonResponse({ message: error instanceof Error ? error.message : 'Nao foi possivel calcular frete.' }, 400);
  }
});
