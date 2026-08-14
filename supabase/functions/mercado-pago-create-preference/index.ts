import { getAuthenticatedUser, getServiceClient, normalizeAddress } from '../_shared/melhor-envio.ts';
import { createMercadoPagoPreference } from '../_shared/mercado-pago.ts';
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
      scope: 'mercado-pago-create-preference',
      subject: user.id,
      maxRequests: 5,
      windowSeconds: 600,
    });
    const body = await req.json() as {
      address: Parameters<typeof normalizeAddress>[0];
      selectedServiceId: string;
    };
    const address = normalizeAddress(body.address);
    const checkout = await createMercadoPagoPreference(
      serviceClient,
      user,
      address,
      body.selectedServiceId,
    );

    return jsonResponse({
      order: checkout.order,
      payment: checkout.payment,
      quote: checkout.quote,
      initPoint: checkout.initPoint,
      sandboxInitPoint: checkout.sandboxInitPoint,
    }, 200, req);
  } catch (error) {
    return jsonResponse({ message: error instanceof Error ? error.message : 'Nao foi possivel iniciar o pagamento.' }, 400, req);
  }
});
