import { getAuthenticatedUser, getServiceClient, normalizeAddress } from '../_shared/melhor-envio.ts';
import { createMercadoPagoPreference } from '../_shared/mercado-pago.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { assertRateLimit } from '../_shared/rate-limit.ts';
import { createLogContext, logCompleted, logError, logInfo } from '../_shared/observability.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  const logContext = createLogContext(req, 'mercado-pago-create-preference');

  if (req.method !== 'POST') {
    logCompleted(logContext, 'METHOD_NOT_ALLOWED', 405, { method: req.method, provider: 'mercado-pago' });
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405, req);
  }

  let userId = '';

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const user = await getAuthenticatedUser(authHeader);
    userId = user.id;
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
    logInfo(logContext, 'CHECKOUT_PAYMENT_STARTED', { userId, provider: 'mercado-pago' });
    const checkout = await createMercadoPagoPreference(
      serviceClient,
      user,
      address,
      body.selectedServiceId,
    );
    logCompleted(logContext, 'CHECKOUT_PAYMENT_CREATED', 200, {
      userId,
      orderId: String(checkout.order['id'] || ''),
      provider: 'mercado-pago',
    });

    return jsonResponse({
      order: checkout.order,
      payment: checkout.payment,
      quote: checkout.quote,
      initPoint: checkout.initPoint,
      sandboxInitPoint: checkout.sandboxInitPoint,
    }, 200, req);
  } catch (error) {
    logError(logContext, 'CHECKOUT_PAYMENT_FAILED', error, {
      userId,
      status: 400,
      provider: 'mercado-pago',
    });
    return jsonResponse({ message: error instanceof Error ? error.message : 'Nao foi possivel iniciar o pagamento.' }, 400, req);
  }
});
