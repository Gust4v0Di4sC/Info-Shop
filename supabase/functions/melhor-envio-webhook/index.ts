import { getServiceClient, mapMelhorEnvioStatus, requiredEnv } from '../_shared/melhor-envio.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { createLogContext, logCompleted, logError, logWarn } from '../_shared/observability.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  const logContext = createLogContext(req, 'melhor-envio-webhook');

  if (req.method === 'GET' || req.method === 'HEAD') {
    logCompleted(logContext, 'WEBHOOK_HEALTHCHECK', 200, { method: req.method, provider: 'melhor-envio' });
    return jsonResponse({ ok: true, service: 'melhor-envio-webhook' }, 200, req);
  }

  if (req.method !== 'POST') {
    logCompleted(logContext, 'METHOD_NOT_ALLOWED', 405, { method: req.method, provider: 'melhor-envio' });
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405, req);
  }

  let melhorEnvioOrderId = '';

  try {
    const signature = req.headers.get('x-me-signature') || '';
    const rawBody = await req.text();

    if (!rawBody.trim()) {
      logCompleted(logContext, 'WEBHOOK_EMPTY_BODY_IGNORED', 200, { provider: 'melhor-envio' });
      return jsonResponse({ ok: true, ignored: true }, 200, req);
    }

    const payload = JSON.parse(rawBody);
    const data = payload?.data || {};
    melhorEnvioOrderId = data.id ? String(data.id) : '';

    if (!melhorEnvioOrderId) {
      logCompleted(logContext, 'WEBHOOK_WITHOUT_ORDER_IGNORED', 200, { provider: 'melhor-envio' });
      return jsonResponse({ ok: true, ignored: true }, 200, req);
    }

    const expectedSignature = await hmacSha256Base64(rawBody, requiredEnv('ME_CLIENT_SECRET'));

    if (signature !== expectedSignature) {
      logWarn(logContext, 'WEBHOOK_INVALID_SIGNATURE', {
        status: 401,
        provider: 'melhor-envio',
        melhorEnvioOrderId,
      });
      return jsonResponse({ message: 'Assinatura invalida.' }, 401, req);
    }

    const status = String(data.status || payload.event || '');
    const trackingCode = data.tracking ? String(data.tracking) : null;
    const trackingUrl = data.self_tracking ? String(data.self_tracking) : null;

    const { error } = await getServiceClient()
      .from('deliveries')
      .update({
        status: mapMelhorEnvioStatus(status),
        label_status: status,
        tracking_code: trackingCode,
        tracking_url: trackingUrl,
        webhook_payload: payload,
        ...(mapMelhorEnvioStatus(status) === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
      })
      .eq('melhor_envio_order_id', melhorEnvioOrderId);

    if (error) {
      throw error;
    }

    logCompleted(logContext, 'WEBHOOK_DELIVERY_SYNCED', 200, {
      provider: 'melhor-envio',
      melhorEnvioOrderId,
      labelStatus: status,
      mappedStatus: mapMelhorEnvioStatus(status),
    });

    return jsonResponse({ ok: true }, 200, req);
  } catch (error) {
    logError(logContext, 'WEBHOOK_DELIVERY_SYNC_FAILED', error, {
      status: 400,
      provider: 'melhor-envio',
      melhorEnvioOrderId,
    });
    return jsonResponse({ message: error instanceof Error ? error.message : 'Falha no webhook.' }, 400, req);
  }
});

async function hmacSha256Base64(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}
