import { createServerClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import compression from 'compression';
import express, { NextFunction, Request, RequestHandler, Response } from 'express';
import { Database } from './app/core/supabase/database.types';
import { environment } from './environments/environment';

const isProduction = process.env['NODE_ENV'] === 'production' || process.env['ENVIRONMENT'] === 'production';
const supabaseUrl = process.env['SUPABASE_URL'] || environment.supabaseUrl;
const supabaseAnonKey = process.env['SUPABASE_ANON_KEY'] || process.env['SUPABASE_KEY'] || environment.supabaseAnonKey;
const allowedProxyPrefixes = ['/rest/v1/', '/storage/v1/', '/functions/v1/'];
const stateChangingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const publicProductSelect = [
  'id',
  'name',
  'model',
  'description',
  'category',
  '"imageUrl"',
  'is_featured',
  'is_offer',
  'offer_badge',
  'offer_ends_at',
  'offer_price',
  'offer_sold_percent',
  'price',
  'created_at',
  'updated_at',
].join(', ');
const optimizedLocalPublicImages = new Map<string, string>([
  ['/imageHero.png', '/imageHero.webp'],
  ['/product1.png', '/product1.webp'],
  ['/product2.png', '/product2.webp'],
  ['/product3.png', '/product3.webp'],
  ['/product4.png', '/product4.webp'],
  ['/productCTA.png', '/productCTA.webp'],
]);

export const app = express();

app.set('trust proxy', 1);
app.use(compression({ threshold: 1024 }));

app.use((req, _res, next) => {
  const functionPrefix = '/.netlify/functions/api';

  if (req.url === functionPrefix || req.url.startsWith(`${functionPrefix}/`)) {
    req.url = `/api${req.url.slice(functionPrefix.length)}`;
  }

  next();
});

app.use((_req, res, next) => {
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  res.setHeader('Content-Security-Policy', contentSecurityPolicy());
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  next();
});

app.use('/api', (req, res, next) => {
  if (!stateChangingMethods.has(req.method)) {
    next();
    return;
  }

  const origin = req.headers.origin;
  if (!origin || origin === requestOrigin(req)) {
    next();
    return;
  }

  res.status(403).json({ message: 'Origem não autorizada.' });
});

app.use('/api/auth', express.json({ limit: '16kb' }));

app.get('/api/auth/session', asyncHandler(async (req, res) => {
  try {
    const { user } = await requireOptionalUser(req, res);
    noStore(res).json({ user });
  } catch (error) {
    errorResponse(res, error, 401);
  }
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  try {
    const body = req.body as { email?: string; password?: string };
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);
    const supabase = createRequestSupabaseClient(req, res);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      throw error || new Error('Não foi possível autenticar.');
    }

    await ensurePublicUser(supabase, data.user);
    noStore(res).json({ user: data.user });
  } catch (error) {
    errorResponse(res, error, 401);
  }
}));

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  try {
    const body = req.body as { email?: string; password?: string; fullName?: string };
    const fullName = normalizeDisplayName(body.fullName);
    const supabase = createRequestSupabaseClient(req, res);
    const { data, error } = await supabase.auth.signUp({
      email: normalizeEmail(body.email),
      password: normalizePassword(body.password),
      options: {
        emailRedirectTo: authCallbackUrl(req),
        data: {
          full_name: fullName,
          name: fullName,
        },
      },
    });

    if (error) {
      throw error;
    }

    if (data.user && data.session) {
      await ensurePublicUser(supabase, data.user);
    }

    noStore(res).json({
      user: data.user,
      needsEmailConfirmation: Boolean(data.user && !data.session),
    });
  } catch (error) {
    errorResponse(res, error, 400);
  }
}));

app.post('/api/auth/resend-confirmation', asyncHandler(async (req, res) => {
  try {
    const supabase = createRequestSupabaseClient(req, res);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: normalizeEmail((req.body as { email?: string }).email),
      options: { emailRedirectTo: authCallbackUrl(req) },
    });

    if (error) {
      throw error;
    }

    noStore(res).json({ ok: true });
  } catch (error) {
    errorResponse(res, error, 400);
  }
}));

app.post('/api/auth/password-reset', asyncHandler(async (req, res) => {
  try {
    const supabase = createRequestSupabaseClient(req, res);
    const { error } = await supabase.auth.resetPasswordForEmail(
      normalizeEmail((req.body as { email?: string }).email),
      { redirectTo: authCallbackUrl(req) },
    );

    if (error) {
      throw error;
    }

    noStore(res).json({ ok: true });
  } catch (error) {
    errorResponse(res, error, 400);
  }
}));

app.post('/api/auth/update-password', asyncHandler(async (req, res) => {
  try {
    await requireUser(req, res);
    const supabase = createRequestSupabaseClient(req, res);
    const { data, error } = await supabase.auth.updateUser({
      password: normalizePassword((req.body as { password?: string }).password),
    });

    if (error) {
      throw error;
    }

    noStore(res).json({ user: data.user });
  } catch (error) {
    errorResponse(res, error, 401);
  }
}));

app.post('/api/auth/logout', asyncHandler(async (req, res) => {
  try {
    const supabase = createRequestSupabaseClient(req, res);
    await supabase.auth.signOut();
    noStore(res).json({ ok: true });
  } catch (error) {
    errorResponse(res, error, 400);
  }
}));

app.get('/api/auth/oauth/google', asyncHandler(async (req, res) => {
  try {
    const supabase = createRequestSupabaseClient(req, res);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: authCallbackUrl(req),
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error || !data.url) {
      throw error || new Error('Não foi possível iniciar o login com o Google.');
    }

    noStore(res).json({ url: data.url });
  } catch (error) {
    errorResponse(res, error, 400);
  }
}));

app.post('/api/auth/callback', asyncHandler(async (req, res) => {
  try {
    const body = req.body as { code?: string; tokenHash?: string; type?: string };
    const supabase = createRequestSupabaseClient(req, res);
    const type = typeof body.type === 'string' ? body.type : undefined;

    if (body.tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: body.tokenHash,
        type: type as Parameters<typeof supabase.auth.verifyOtp>[0]['type'],
      });

      if (error) {
        throw error;
      }
    } else if (body.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(body.code);

      if (error) {
        throw error;
      }
    } else {
      throw new Error('Retorno sem código de autenticação.');
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw error || new Error('Sessão de login não encontrada.');
    }

    await ensurePublicUser(supabase, data.user);
    noStore(res).json({ user: data.user, type });
  } catch (error) {
    errorResponse(res, error, 401);
  }
}));

app.get('/api/public/products/offer', asyncHandler(async (req, res) => {
  try {
    const supabase = createRequestSupabaseClient(req, res);
    const { data, error } = await supabase
      .from('products')
      .select(publicProductSelect)
      .eq('is_offer', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    publicCache(res).json(optimizePublicProductImage(data as PublicProductResponse | null));
  } catch (error) {
    errorResponse(res, error, 502);
  }
}));

app.get('/api/public/products/:id', asyncHandler(async (req, res) => {
  try {
    const productId = Number(req.params['id']);

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ message: 'Produto inválido.' });
      return;
    }

    const supabase = createRequestSupabaseClient(req, res);
    const { data, error } = await supabase
      .from('products')
      .select(publicProductSelect)
      .eq('id', productId)
      .single();

    if (error) {
      throw error;
    }

    publicCache(res).json(optimizePublicProductImage(data as PublicProductResponse));
  } catch (error) {
    errorResponse(res, error, 404);
  }
}));

app.get('/api/public/products', asyncHandler(async (req, res) => {
  try {
    const category = normalizeSlugQuery(req.query['category']);
    const searchTerm = normalizeSearchQuery(req.query['q']);
    const limit = normalizeLimitQuery(req.query['limit']);
    const featuredOnly = normalizeBooleanQuery(req.query['featured']);
    const supabase = createRequestSupabaseClient(req, res);
    let query = supabase
      .from('products')
      .select(publicProductSelect)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(0, limit - 1);

    if (category) {
      query = query.eq('category', category);
    }

    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }

    if (searchTerm) {
      query = query.or([
        `name.ilike.%${searchTerm}%`,
        `model.ilike.%${searchTerm}%`,
        `description.ilike.%${searchTerm}%`,
      ].join(','));
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    publicCache(res).json((data || []).map(product => optimizePublicProductImage(product as PublicProductResponse)));
  } catch (error) {
    errorResponse(res, error, 502);
  }
}));

app.use('/api/supabase', asyncHandler(async (req, res) => {
  let requestBody: Buffer | undefined;
  let hasSession = false;

  try {
    if (!allowedProxyPrefixes.some(prefix => req.path.startsWith(prefix))) {
      res.status(404).json({ message: 'Rota do Supabase não permitida.' });
      return;
    }

    const target = new URL(req.url, supabaseUrl);
    const { session } = await requireOptionalSession(req, res);
    hasSession = Boolean(session);
    const headers = new Headers();

    for (const [name, value] of Object.entries(req.headers)) {
      if (!value || ['host', 'cookie', 'authorization', 'apikey', 'content-length'].includes(name.toLowerCase())) {
        continue;
      }

      headers.set(name, Array.isArray(value) ? value.join(',') : value);
    }

    headers.set('apikey', supabaseAnonKey);
    headers.set('Authorization', `Bearer ${session?.access_token || supabaseAnonKey}`);

    requestBody = ['GET', 'HEAD'].includes(req.method)
      ? undefined
      : await readProxyRequestBody(req);
    const upstreamBody = requestBody
      ? requestBody.buffer.slice(
          requestBody.byteOffset,
          requestBody.byteOffset + requestBody.byteLength,
        ) as ArrayBuffer
      : undefined;
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: upstreamBody,
    });

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (![
        'alt-svc',
        'connection',
        'content-encoding',
        'content-length',
        'keep-alive',
        'proxy-authenticate',
        'proxy-authorization',
        'strict-transport-security',
        'set-cookie',
        'te',
        'trailer',
        'transfer-encoding',
        'upgrade',
      ].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    const upstreamBuffer = Buffer.from(await upstream.arrayBuffer());
    const localFallback = localSupabaseFunctionFallback(req, upstream, upstreamBuffer, requestBody, hasSession);

    if (localFallback) {
      res.status(localFallback.status);
      res.setHeader('Content-Type', 'application/json');
      noStore(res);
      res.send(JSON.stringify(localFallback.body));
      return;
    }

    noStore(res);
    res.send(upstreamBuffer);
  } catch (error) {
    const localFallback = localSupabaseFunctionFallback(req, null, Buffer.alloc(0), requestBody, hasSession);

    if (localFallback) {
      res.status(localFallback.status);
      res.setHeader('Content-Type', 'application/json');
      noStore(res);
      res.send(JSON.stringify(localFallback.body));
      return;
    }

    errorResponse(res, error, 502);
  }
}));

interface LocalSupabaseFunctionFallback {
  status: number;
  body: unknown;
}

function localSupabaseFunctionFallback(
  req: Request,
  upstream: globalThis.Response | null,
  upstreamBody: Buffer,
  requestBody?: Buffer,
  hasSession = false,
): LocalSupabaseFunctionFallback | null {
  const allowProductionFallback = req.path === '/functions/v1/hardware-benchmark-chat';

  if ((isProduction && !allowProductionFallback) || req.method !== 'POST') {
    return null;
  }

  if (req.path === '/functions/v1/melhor-envio-quote') {
    return localShippingQuoteFallback(upstream, upstreamBody, requestBody);
  }

  if (req.path === '/functions/v1/hardware-benchmark-chat') {
    return localHardwareBenchmarkFallback(upstream, requestBody, hasSession);
  }

  if (req.path === '/functions/v1/mercado-pago-create-preference') {
    return localPaymentPreferenceFallback(upstream, requestBody);
  }

  return null;
}

function localShippingQuoteFallback(
  upstream: globalThis.Response | null,
  upstreamBody: Buffer,
  requestBody?: Buffer,
): LocalSupabaseFunctionFallback | null {
  const upstreamJson = parseJsonBuffer(upstreamBody);
  const quotes = Array.isArray(upstreamJson?.['quotes']) ? upstreamJson['quotes'] as unknown[] : null;
  const shouldFallback = !upstream || !upstream.ok || (quotes && quotes.length === 0);

  if (!shouldFallback) {
    return null;
  }

  const requestJson = parseJsonBuffer(requestBody);
  const address = requestJson?.['address'] && typeof requestJson['address'] === 'object'
    ? requestJson['address'] as Record<string, unknown>
    : {};

  return {
    status: 200,
    body: {
      quotes: buildLocalShippingQuotes(address),
      localFallback: true,
    },
  };
}

function localHardwareBenchmarkFallback(
  upstream: globalThis.Response | null,
  requestBody?: Buffer,
  hasSession = false,
): LocalSupabaseFunctionFallback | null {
  if (!hasSession) {
    return null;
  }

  if (upstream && ![400, 404].includes(upstream.status) && upstream.status < 500) {
    return null;
  }

  const requestJson = parseJsonBuffer(requestBody);
  const productId = Number(requestJson?.['productId']);
  const currentHardware = String(requestJson?.['currentHardware'] || '').trim();
  const message = String(requestJson?.['message'] || '').trim();

  if (!Number.isInteger(productId) || productId <= 0 || !currentHardware || !message) {
    return null;
  }

  return {
    status: 200,
    body: {
      answer: buildLocalHardwareBenchmarkAnswer(currentHardware, message),
      localFallback: true,
    },
  };
}

function localPaymentPreferenceFallback(
  upstream: globalThis.Response | null,
  requestBody?: Buffer,
): LocalSupabaseFunctionFallback | null {
  if (upstream && upstream.status !== 404 && upstream.status < 500) {
    return null;
  }

  const requestJson = parseJsonBuffer(requestBody);
  const selectedServiceId = String(requestJson?.['selectedServiceId'] || '');

  if (!selectedServiceId.startsWith('local-')) {
    return null;
  }

  const orderId = `local-${Date.now()}`;
  const address = requestJson?.['address'] && typeof requestJson['address'] === 'object'
    ? requestJson['address'] as Record<string, unknown>
    : {};
  const quotes = buildLocalShippingQuotes(address);
  const quote = quotes.find(item => item['id'] === selectedServiceId) || quotes[0];

  return {
    status: 200,
    body: {
      order: { id: orderId, status: 'payment_pending' },
      payment: { id: `payment-${orderId}`, status: 'local_pending' },
      quote,
      initPoint: `/pagamento/retorno?status=pending&order_id=${orderId}&local=1`,
      sandboxInitPoint: null,
      localFallback: true,
    },
  };
}

function buildLocalHardwareBenchmarkAnswer(currentHardware: string, message: string): string {
  const hardware = currentHardware.slice(0, 180);
  const question = message.slice(0, 160);

  return [
    `Com base no hardware informado (${hardware}), a recomendacao depende do componente exato do produto e do uso esperado.`,
    `Para a pergunta "${question}", compare principalmente CPU, GPU, memoria, armazenamento, compatibilidade da placa-mae e fonte.`,
    'Se o produto tiver GPU/CPU mais recente ou corrigir um gargalo claro do seu setup, tende a ser um upgrade. Se o ganho for pequeno, priorize custo-beneficio e compatibilidade antes da compra.',
  ].join(' ');
}

function buildLocalShippingQuotes(address: Record<string, unknown>): Array<Record<string, unknown>> {
  const postalCode = onlyDigits(String(address['postalCode'] || ''));
  const state = String(address['state'] || '').trim().toUpperCase();
  const cepPrefix = Number(postalCode.slice(0, 2));
  const zone = Number.isFinite(cepPrefix) && cepPrefix > 0
    ? Math.max(1, Math.min(6, Math.ceil(Math.abs(cepPrefix - 29) / 12) + 1))
    : 3;
  const interstateFee = state && !['ES', 'RJ', 'MG', 'SP'].includes(state) ? 9 : 0;
  const standardPrice = roundMoney(16.9 + zone * 4.2 + interstateFee);
  const expressPrice = roundMoney(standardPrice + 14.5 + Math.max(0, 5 - zone));

  return [
    {
      id: 'local-standard',
      name: 'Entrega local economica',
      company: 'InfoShop Local',
      price: standardPrice,
      deliveryTime: Math.max(3, zone + 2),
      raw: { localFallback: true },
    },
    {
      id: 'local-express',
      name: 'Entrega local expressa',
      company: 'InfoShop Local',
      price: expressPrice,
      deliveryTime: Math.max(1, Math.ceil(zone / 2)),
      raw: { localFallback: true },
    },
  ];
}

function parseJsonBuffer(buffer?: Buffer): Record<string, unknown> | null {
  if (!buffer || buffer.length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(buffer.toString('utf8')) as unknown;
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}

function contentSecurityPolicy(): string {
  const scriptSources = ["'self'", "'unsafe-inline'"];
  const workerSources = ["'self'", 'blob:'];
  const connectSources = ["'self'", 'https://*.supabase.co', 'https://viacep.com.br'];

  const sentryOrigin = sentryDsnOrigin();
  if (sentryOrigin) {
    connectSources.push(
      sentryOrigin,
      'https://*.ingest.sentry.io',
      'https://*.ingest.de.sentry.io',
      'https://*.sentry.io',
    );
  }

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self' data:",
    "img-src 'self' data: blob: https://*.supabase.co https://lh3.googleusercontent.com",
    `connect-src ${connectSources.join(' ')}`,
    `worker-src ${workerSources.join(' ')}`,
    "form-action 'self'",
  ];

  if (isProduction) {
    directives.push('upgrade-insecure-requests');
  }

  return directives.join('; ');
}

function sentryDsnOrigin(): string | null {
  if (!environment.sentryDsn) {
    return null;
  }

  try {
    return new URL(environment.sentryDsn).origin;
  } catch {
    return null;
  }
}

function createRequestSupabaseClient(req: Request, res: Response) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('A URL e a chave anônima do Supabase precisam estar configuradas no servidor.');
  }

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    cookieOptions: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
    },
    cookies: {
      getAll() {
        return parseCookies(req.headers.cookie || '');
      },
      setAll(cookies, headers) {
        for (const [name, value] of Object.entries(headers || {})) {
          res.setHeader(name, value);
        }

        cookies.forEach(({ name, value, options }) => {
          res.cookie(name, value, {
            ...options,
            httpOnly: true,
            sameSite: 'lax',
            secure: isProduction,
            path: '/',
          });
        });
      },
    },
  });
}

async function requireOptionalSession(req: Request, res: Response) {
  const supabase = createRequestSupabaseClient(req, res);
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return { supabase, session: data.session };
}

async function requireOptionalUser(req: Request, res: Response) {
  const supabase = createRequestSupabaseClient(req, res);
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return { supabase, user: null };
  }

  return { supabase, user: data.user };
}

async function requireUser(req: Request, res: Response) {
  const { supabase, user } = await requireOptionalUser(req, res);

  if (!user) {
    throw new Error('Entre na sua conta para continuar.');
  }

  return { supabase, user };
}

async function ensurePublicUser(supabase: ReturnType<typeof createRequestSupabaseClient>, user: User): Promise<void> {
  const metadata = user.user_metadata || {};
  const fullName = metadataValue(metadata, 'full_name') || metadataValue(metadata, 'name');
  const avatarUrl = metadataValue(metadata, 'avatar_url') || metadataValue(metadata, 'picture');
  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email || '',
      full_name: fullName,
      avatar_url: avatarUrl,
    }, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

function parseCookies(header: string): { name: string; value: string }[] {
  return header
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const separatorIndex = part.indexOf('=');
      const name = separatorIndex >= 0 ? part.slice(0, separatorIndex) : part;
      const value = separatorIndex >= 0 ? part.slice(separatorIndex + 1) : '';

      return {
        name,
        value: decodeURIComponent(value),
      };
    });
}

async function readProxyRequestBody(req: Request, maxBytes = 12 * 1024 * 1024): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;

    if (totalBytes > maxBytes) {
      throw new Error('O corpo da requisição excede o limite permitido.');
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks, totalBytes);
}

function requestOrigin(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

function authCallbackUrl(req: Request): string {
  return `${process.env['PUBLIC_SITE_URL'] || requestOrigin(req)}/auth/callback`;
}

function noStore(res: Response): Response {
  res.setHeader('Cache-Control', 'private, no-store');
  return res;
}

function publicCache(res: Response): Response {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=300');
  return res;
}

function normalizeLimitQuery(value: unknown): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue || 24);

  if (!Number.isInteger(parsed)) {
    return 24;
  }

  return Math.min(Math.max(parsed, 1), 24);
}

type PublicProductResponse = { imageUrl?: string | null };

function optimizePublicProductImage<T extends PublicProductResponse | null>(product: T): T {
  if (!product?.imageUrl) {
    return product;
  }

  const optimizedImageUrl = optimizedLocalPublicImages.get(product.imageUrl.split('?')[0]);

  if (!optimizedImageUrl) {
    return product;
  }

  return {
    ...product,
    imageUrl: optimizedImageUrl,
  };
}

function normalizeBooleanQuery(value: unknown): boolean {
  const rawValue = Array.isArray(value) ? value[0] : value;

  return rawValue === 'true' || rawValue === '1';
}

function normalizeSlugQuery(value: unknown): string | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== 'string') {
    return null;
  }

  const slug = rawValue.trim().toLowerCase();

  return /^[a-z0-9-]{1,60}$/.test(slug) ? slug : null;
}

function normalizeSearchQuery(value: unknown): string {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== 'string') {
    return '';
  }

  return rawValue
    .trim()
    .slice(0, 80)
    .replace(/[%_,().]/g, ' ')
    .replace(/\s+/g, ' ');
}

function errorResponse(res: Response, error: unknown, fallbackStatus: number): void {
  const message = error instanceof Error ? error.message : 'Falha ao processar a requisição.';
  res.status(fallbackStatus).json({ message });
}

function normalizeEmail(value: string | undefined): string {
  const email = (value || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Informe um e-mail válido.');
  }

  return email;
}

function normalizePassword(value: string | undefined): string {
  const password = value || '';

  if (password.length < 6 || password.length > 256) {
    throw new Error('Senha inválida.');
  }

  return password;
}

function normalizeDisplayName(value: string | undefined): string {
  const name = (value || '').trim();

  if (name.length < 3 || name.length > 120) {
    throw new Error('Nome inválido.');
  }

  return name;
}

function metadataValue(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

