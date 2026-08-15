import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import { ɵsetAngularAppEngineManifest as setAngularAppEngineManifest } from '@angular/ssr';
import { createServerClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import compression from 'compression';
import express, { Request, Response } from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Database } from './app/core/supabase/database.types';
import { environment } from './environments/environment';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');
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

const app = express();
let angularAppPromise: Promise<AngularNodeAppEngine> | null = null;

app.set('trust proxy', 1);
app.use(compression({ threshold: 1024 }));

app.use((_req, res, next) => {
  if (isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "script-src 'self' https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com data:",
      "img-src 'self' data: blob: https://*.supabase.co",
      "connect-src 'self' https://*.supabase.co",
      "form-action 'self'",
      'upgrade-insecure-requests',
    ].join('; '),
  );
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

  res.status(403).json({ message: 'Origem nao autorizada.' });
});

app.use('/api/auth', express.json({ limit: '16kb' }));

app.get('/api/auth/session', async (req, res) => {
  try {
    const { user } = await requireOptionalUser(req, res);
    noStore(res).json({ user });
  } catch (error) {
    errorResponse(res, error, 401);
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const body = req.body as { email?: string; password?: string };
    const email = normalizeEmail(body.email);
    const password = normalizePassword(body.password);
    const supabase = createRequestSupabaseClient(req, res);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.user) {
      throw error || new Error('Nao foi possivel autenticar.');
    }

    await ensurePublicUser(supabase, data.user);
    noStore(res).json({ user: data.user });
  } catch (error) {
    errorResponse(res, error, 401);
  }
});

app.post('/api/auth/register', async (req, res) => {
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
});

app.post('/api/auth/resend-confirmation', async (req, res) => {
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
});

app.post('/api/auth/password-reset', async (req, res) => {
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
});

app.post('/api/auth/update-password', async (req, res) => {
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
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const supabase = createRequestSupabaseClient(req, res);
    await supabase.auth.signOut();
    noStore(res).json({ ok: true });
  } catch (error) {
    errorResponse(res, error, 400);
  }
});

app.get('/api/auth/oauth/google', async (req, res) => {
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
      throw error || new Error('Nao foi possivel iniciar login Google.');
    }

    noStore(res).json({ url: data.url });
  } catch (error) {
    errorResponse(res, error, 400);
  }
});

app.post('/api/auth/callback', async (req, res) => {
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
      throw new Error('Callback sem codigo de autenticacao.');
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw error || new Error('Sessao de login nao encontrada.');
    }

    await ensurePublicUser(supabase, data.user);
    noStore(res).json({ user: data.user, type });
  } catch (error) {
    errorResponse(res, error, 401);
  }
});

app.get('/api/public/products/offer', async (req, res) => {
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
});

app.get('/api/public/products/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      res.status(400).json({ message: 'Produto invalido.' });
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
});

app.get('/api/public/products', async (req, res) => {
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
});

app.use('/api/supabase', async (req, res) => {
  try {
    if (!allowedProxyPrefixes.some(prefix => req.path.startsWith(prefix))) {
      res.status(404).json({ message: 'Rota Supabase nao permitida.' });
      return;
    }

    const target = new URL(`${supabaseUrl}${req.originalUrl.replace(/^\/api\/supabase/, '')}`);
    const { session } = await requireOptionalSession(req, res);
    const headers = new Headers();

    for (const [name, value] of Object.entries(req.headers)) {
      if (!value || ['host', 'cookie', 'authorization', 'apikey', 'content-length'].includes(name.toLowerCase())) {
        continue;
      }

      headers.set(name, Array.isArray(value) ? value.join(',') : value);
    }

    headers.set('apikey', supabaseAnonKey);
    headers.set('Authorization', `Bearer ${session?.access_token || supabaseAnonKey}`);

    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });

    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie'].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    });
    noStore(res);
    res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    errorResponse(res, error, 502);
  }
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    setHeaders(res, filePath) {
      if (
        filePath.endsWith('ngsw-worker.js') ||
        filePath.endsWith('ngsw.json') ||
        filePath.endsWith('safety-worker.js') ||
        filePath.endsWith('worker-basic.min.js')
      ) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }),
);

app.use(async (req, res, next) => {
  try {
    const angularApp = await getAngularAppEngine();
    const response = await angularApp.handle(req);

    if (response) {
      await writeResponseToNodeResponse(response, res);
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
});

if (isMainModule(import.meta.url) || isBundledServerEntrypoint()) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

export const reqHandler = createNodeRequestHandler(app);
export default reqHandler;

function getAngularAppEngine(): Promise<AngularNodeAppEngine> {
  angularAppPromise ??= createAngularAppEngine();

  return angularAppPromise;
}

async function createAngularAppEngine(): Promise<AngularNodeAppEngine> {
  const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;
  const manifestModule = await dynamicImport('./angular-app-engine-manifest.mjs');

  setAngularAppEngineManifest(manifestModule.default);

  return new AngularNodeAppEngine({
    allowedHosts: angularAllowedHosts(),
  });
}

function angularAllowedHosts(): string[] {
  const hosts = new Set(['localhost', '127.0.0.1']);
  const publicSiteUrl = process.env['PUBLIC_SITE_URL'];
  const envAllowedHosts = process.env['NG_ALLOWED_HOSTS'];

  if (publicSiteUrl) {
    try {
      hosts.add(new URL(publicSiteUrl).hostname);
    } catch {
      // Ignore malformed optional deployment URLs.
    }
  }

  if (envAllowedHosts) {
    envAllowedHosts
      .split(',')
      .map(host => host.trim())
      .filter(Boolean)
      .forEach(host => hosts.add(host));
  }

  return Array.from(hosts);
}

function createRequestSupabaseClient(req: Request, res: Response) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL e anon key precisam estar configuradas no servidor.');
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
  const message = error instanceof Error ? error.message : 'Falha ao processar requisicao.';
  res.status(fallbackStatus).json({ message });
}

function normalizeEmail(value: string | undefined): string {
  const email = (value || '').trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Informe um e-mail valido.');
  }

  return email;
}

function normalizePassword(value: string | undefined): string {
  const password = value || '';

  if (password.length < 6 || password.length > 256) {
    throw new Error('Senha invalida.');
  }

  return password;
}

function normalizeDisplayName(value: string | undefined): string {
  const name = (value || '').trim();

  if (name.length < 3 || name.length > 120) {
    throw new Error('Nome invalido.');
  }

  return name;
}

function metadataValue(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === 'string' && value.trim() ? value : null;
}

function isBundledServerEntrypoint(): boolean {
  return process.argv[1]?.replace(/\\/g, '/').endsWith('/server.mjs') === true;
}
