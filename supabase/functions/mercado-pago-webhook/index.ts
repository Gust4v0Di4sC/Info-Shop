import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { syncMercadoPagoPayment, validateMercadoPagoSignature } from '../_shared/mercado-pago.ts';

type JsonRecord = Record<string, unknown>;

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse();
  }

  if (req.method !== 'POST') {
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405);
  }

  let payload: JsonRecord = {};

  try {
    payload = await req.json() as JsonRecord;
  } catch {
    return jsonResponse({ message: 'Payload invalido.' }, 400);
  }

  const url = new URL(req.url);
  const dataId = url.searchParams.get('data.id')
    || (typeof payload['data'] === 'object' && payload['data'] !== null
      ? String((payload['data'] as JsonRecord)['id'] || '')
      : '');
  const eventType = String(url.searchParams.get('type') || payload['type'] || '');

  if (eventType !== 'payment' || !dataId) {
    return jsonResponse({ ok: true, ignored: true });
  }

  if (!(await validateMercadoPagoSignature(req, dataId))) {
    return jsonResponse({ message: 'Assinatura invalida.' }, 401);
  }

  try {
    await syncMercadoPagoPayment(dataId, payload);
    return jsonResponse({ ok: true });
  } catch (error) {
    return jsonResponse({ message: error instanceof Error ? error.message : 'Nao foi possivel processar webhook.' }, 400);
  }
});
