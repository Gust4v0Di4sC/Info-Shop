import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { syncMercadoPagoPayment, validateMercadoPagoSignature } from '../_shared/mercado-pago.ts';
import { createLogContext, logCompleted, logError, logWarn } from '../_shared/observability.ts';

type JsonRecord = Record<string, unknown>;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  const logContext = createLogContext(req, 'mercado-pago-webhook');

  if (req.method !== 'POST') {
    logCompleted(logContext, 'METHOD_NOT_ALLOWED', 405, { method: req.method, provider: 'mercado-pago' });
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405, req);
  }

  let payload: JsonRecord = {};

  try {
    payload = await req.json() as JsonRecord;
  } catch {
    logCompleted(logContext, 'WEBHOOK_INVALID_PAYLOAD', 400, { provider: 'mercado-pago' });
    return jsonResponse({ message: 'Payload invalido.' }, 400, req);
  }

  const url = new URL(req.url);
  const dataId = url.searchParams.get('data.id')
    || (typeof payload['data'] === 'object' && payload['data'] !== null
      ? String((payload['data'] as JsonRecord)['id'] || '')
      : '');
  const eventType = String(url.searchParams.get('type') || payload['type'] || '');

  if (eventType !== 'payment' || !dataId) {
    logCompleted(logContext, 'WEBHOOK_IGNORED', 200, { provider: 'mercado-pago', eventType });
    return jsonResponse({ ok: true, ignored: true }, 200, req);
  }

  if (!(await validateMercadoPagoSignature(req, dataId))) {
    logWarn(logContext, 'WEBHOOK_INVALID_SIGNATURE', {
      status: 401,
      provider: 'mercado-pago',
      providerPaymentId: dataId,
    });
    return jsonResponse({ message: 'Assinatura invalida.' }, 401, req);
  }

  try {
    await syncMercadoPagoPayment(dataId, payload);
    logCompleted(logContext, 'WEBHOOK_PAYMENT_SYNCED', 200, {
      provider: 'mercado-pago',
      providerPaymentId: dataId,
    });
    return jsonResponse({ ok: true }, 200, req);
  } catch (error) {
    logError(logContext, 'WEBHOOK_PAYMENT_SYNC_FAILED', error, {
      status: 400,
      provider: 'mercado-pago',
      providerPaymentId: dataId,
    });
    return jsonResponse({ message: error instanceof Error ? error.message : 'Nao foi possivel processar webhook.' }, 400, req);
  }
});
