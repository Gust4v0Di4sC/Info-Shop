import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/angular';
import { environment } from '@environments/environment';
import { requestIdFromHeaders, REQUEST_ID_HEADER } from '@app/core/observability/request-id';
import { Database } from './database.types';

const supabaseUrl = environment.supabaseUrl?.trim();
const supabaseAnonKey = environment.supabaseAnonKey?.trim();
const isBrowser = typeof window !== 'undefined';
const runtimeSupabaseUrl = supabaseUrl || (isBrowser ? '' : 'https://example.supabase.co');
const runtimeSupabaseAnonKey = supabaseAnonKey || (isBrowser ? '' : 'anon-key');
const SLOW_SUPABASE_REQUEST_THRESHOLD_MS = 2000;
const RETRYABLE_SUPABASE_STATUSES = new Set([502, 503, 504]);
const SUPABASE_RETRY_DELAYS_MS = [500, 1500, 3000];

if (isBrowser && (!runtimeSupabaseUrl || !runtimeSupabaseAnonKey)) {
  throw new Error('Supabase URL e anon key precisam estar configuradas no environment.');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  runtimeSupabaseUrl,
  runtimeSupabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
    global: {
      fetch: proxiedSupabaseFetch,
    },
  },
);

async function proxiedSupabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof window === 'undefined') {
    return fetch(input, init);
  }

  const originalRequest = new Request(input, init);
  const url = new URL(originalRequest.url);
  const supabaseOrigin = new URL(runtimeSupabaseUrl).origin;
  const shouldProxy =
    url.origin === supabaseOrigin &&
    (
      url.pathname.startsWith('/rest/v1/') ||
      url.pathname.startsWith('/storage/v1/') ||
      url.pathname.startsWith('/functions/v1/')
    );

  if (!shouldProxy) {
    return fetch(originalRequest);
  }

  const headers = new Headers(originalRequest.headers);
  const requestId = requestIdFromHeaders(headers);
  headers.delete('authorization');
  headers.delete('apikey');
  headers.set(REQUEST_ID_HEADER, requestId);

  const requestBody = ['GET', 'HEAD'].includes(originalRequest.method)
    ? undefined
    : await originalRequest.arrayBuffer();
  const proxiedRequest = new Request(`/api/supabase${url.pathname}${url.search}`, {
    method: originalRequest.method,
    headers,
    body: requestBody,
    credentials: 'same-origin',
  });

  return fetchSupabaseWithRetry(proxiedRequest, requestId);
}

async function fetchSupabaseWithRetry(request: Request, requestId: string): Promise<Response> {
  for (let attempt = 0; attempt <= SUPABASE_RETRY_DELAYS_MS.length; attempt++) {
    let response: Response;

    try {
      response = await observedSupabaseFetch(request.clone(), requestId);
    } catch (error) {
      const retryDelay = SUPABASE_RETRY_DELAYS_MS[attempt];

      if (!isRetryableSupabaseRequest(request) || retryDelay === undefined) {
        throw error;
      }

      await delay(retryDelay);
      continue;
    }

    if (!isRetryableSupabaseResponse(request, response)) {
      return response;
    }

    const retryDelay = SUPABASE_RETRY_DELAYS_MS[attempt];

    if (retryDelay === undefined) {
      return response;
    }

    await response.arrayBuffer();
    await delay(retryDelay);
  }

  return observedSupabaseFetch(request, requestId);
}

async function observedSupabaseFetch(request: Request, requestId: string): Promise<Response> {
  const startedAt = performance.now();

  try {
    const response = await fetch(request);
    recordSupabaseFetchTelemetry(request, response, requestId, performance.now() - startedAt);
    return response;
  } catch (error) {
    captureSupabaseException(error, {
      requestId,
      method: request.method,
      status: 'network_error',
      url: sanitizedUrl(request.url),
      durationMs: Math.round(performance.now() - startedAt),
    });

    throw error;
  }
}

function recordSupabaseFetchTelemetry(
  request: Request,
  response: Response,
  requestId: string,
  durationMs: number,
): void {
  const roundedDuration = Math.round(durationMs);
  const baseContext = {
    tags: {
      requestId,
      service: 'supabase',
      method: request.method,
      status: String(response.status),
    },
    extra: {
      url: sanitizedUrl(request.url),
      durationMs: roundedDuration,
    },
  };

  if (!response.ok) {
    captureSupabaseMessage('Supabase fetch failed', response.status >= 500 ? 'error' : 'warning', baseContext);
    return;
  }

  if (durationMs > SLOW_SUPABASE_REQUEST_THRESHOLD_MS) {
    captureSupabaseMessage('Slow Supabase request', 'warning', baseContext);
  }
}

function captureSupabaseException(
  error: unknown,
  context: { requestId: string; method: string; status: string; url: string; durationMs: number },
): void {
  if (!environment.sentryDsn) {
    return;
  }

  Sentry.captureException(error, {
    tags: {
      requestId: context.requestId,
      service: 'supabase',
      method: context.method,
      status: context.status,
    },
    extra: {
      url: context.url,
      durationMs: context.durationMs,
    },
  });
}

function captureSupabaseMessage(
  message: string,
  level: 'warning' | 'error',
  context: {
    tags: { requestId: string; service: string; method: string; status: string };
    extra: { url: string; durationMs: number };
  },
): void {
  if (!environment.sentryDsn) {
    return;
  }

  Sentry.captureMessage(message, {
    ...context,
    level,
  });
}

function isRetryableSupabaseResponse(request: Request, response: Response): boolean {
  return RETRYABLE_SUPABASE_STATUSES.has(response.status) && isRetryableSupabaseRequest(request);
}

function isRetryableSupabaseRequest(request: Request): boolean {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return true;
  }

  const url = new URL(request.url, window.location.origin);
  const isIdempotentStorageUpload =
    request.method === 'POST' &&
    url.pathname.includes('/storage/v1/object/') &&
    request.headers.get('x-upsert') === 'true';

  return isIdempotentStorageUpload ||
    (request.method === 'POST' && url.pathname.endsWith('/rpc/get_current_admin_stores'));
}

function sanitizedUrl(value: string): string {
  const url = new URL(value, window.location.origin);
  return `${url.origin}${url.pathname}`;
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}
