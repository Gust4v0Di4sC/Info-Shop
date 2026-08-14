import { getServiceClient, mapMelhorEnvioStatus, requiredEnv } from '../_shared/melhor-envio.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return jsonResponse({ ok: true, service: 'melhor-envio-webhook' }, 200, req);
  }

  if (req.method !== 'POST') {
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405, req);
  }

  try {
    const signature = req.headers.get('x-me-signature') || '';
    const rawBody = await req.text();

    if (!rawBody.trim()) {
      return jsonResponse({ ok: true, ignored: true }, 200, req);
    }

    const payload = JSON.parse(rawBody);
    const data = payload?.data || {};
    const melhorEnvioOrderId = data.id ? String(data.id) : '';

    if (!melhorEnvioOrderId) {
      return jsonResponse({ ok: true, ignored: true }, 200, req);
    }

    const expectedSignature = await hmacSha256Base64(rawBody, requiredEnv('ME_CLIENT_SECRET'));

    if (signature !== expectedSignature) {
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

    return jsonResponse({ ok: true }, 200, req);
  } catch (error) {
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
