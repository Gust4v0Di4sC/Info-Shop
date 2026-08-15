const LOCAL_ALLOWED_ORIGINS = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
];

const ALLOWED_HEADERS = [
  'authorization',
  'x-client-info',
  'apikey',
  'content-type',
  'x-me-signature',
  'x-signature',
  'x-request-id',
  'sentry-trace',
  'baggage',
].join(', ');

const ALLOWED_METHODS = 'GET, POST, OPTIONS';

export function corsHeadersForRequest(req?: Request): Record<string, string> {
  const origin = req?.headers.get('Origin') || '';
  const allowedOrigin = allowedResponseOrigin(origin);

  return {
    ...(allowedOrigin ? { 'Access-Control-Allow-Origin': allowedOrigin } : {}),
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Vary': 'Origin',
  };
}

export function isCorsAllowed(req: Request): boolean {
  const origin = req.headers.get('Origin');
  return !origin || allowedOrigins().includes(origin);
}

export function jsonResponse(body: unknown, status = 200, req?: Request): Response {
  const requestId = req?.headers.get('x-request-id');

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeadersForRequest(req),
      ...(requestId ? { 'X-Request-ID': requestId } : {}),
      'Content-Type': 'application/json',
    },
  });
}

export function optionsResponse(req: Request): Response {
  if (!isCorsAllowed(req)) {
    return jsonResponse({ message: 'Origem nao permitida.' }, 403, req);
  }

  return new Response('ok', { headers: corsHeadersForRequest(req) });
}

function allowedResponseOrigin(origin: string): string {
  if (origin && allowedOrigins().includes(origin)) {
    return origin;
  }

  return allowedOrigins()[0] || '';
}

function allowedOrigins(): string[] {
  const configured = [
    ...splitOrigins(Deno.env.get('ALLOWED_ORIGINS')),
    ...splitOrigins(Deno.env.get('PUBLIC_SITE_URL')),
  ];
  const origins = isProduction() ? configured : [...configured, ...LOCAL_ALLOWED_ORIGINS];

  return [...new Set(origins.map(origin => origin.replace(/\/$/, '')).filter(Boolean))];
}

function splitOrigins(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

function isProduction(): boolean {
  return (Deno.env.get('ENVIRONMENT') || '').toLowerCase() === 'production';
}
