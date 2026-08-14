import { getServiceClient } from '../_shared/melhor-envio.ts';
import { jsonResponse, optionsResponse } from '../_shared/cors.ts';
import { assertRateLimit, clientIp } from '../_shared/rate-limit.ts';

interface NewsletterRequest {
  email?: string;
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req);
  }

  if (req.method !== 'POST') {
    return jsonResponse({ message: 'Metodo nao permitido.' }, 405, req);
  }

  try {
    const body = await req.json() as NewsletterRequest;
    const email = normalizeEmail(body.email);
    const serviceClient = getServiceClient();
    await assertRateLimit(serviceClient, {
      scope: 'newsletter-subscribe',
      subject: `${clientIp(req)}:${email}`,
      maxRequests: 5,
      windowSeconds: 3600,
    });

    const { data, error } = await serviceClient
      .rpc('subscribe_newsletter', { email_value: email });

    if (error) {
      throw error;
    }

    await sendWelcomeEmail(email);

    return jsonResponse({ subscriber: data }, 200, req);
  } catch (error) {
    return jsonResponse({
      message: error instanceof Error ? error.message : 'Nao foi possivel concluir a inscricao.',
    }, 400, req);
  }
});

function normalizeEmail(email: string | undefined): string {
  const normalized = (email || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Informe um e-mail valido.');
  }

  return normalized;
}

async function sendWelcomeEmail(email: string): Promise<void> {
  const apiKey = Deno.env.get('BREVO_API_KEY');
  const templateId = Number(Deno.env.get('BREVO_NEWSLETTER_TEMPLATE_ID') || 0);

  if (!apiKey || !templateId) {
    return;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      templateId,
      to: [{ email }],
      params: {
        EMAIL: email,
        STORE_NAME: 'InfoShop',
      },
    }),
  });

  if (!response.ok) {
    console.error('Newsletter email was not sent.', await response.text());
  }
}
