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

function proxiedSupabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
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

  const proxiedRequest = new Request(`/api/supabase${url.pathname}${url.search}`, {
    method: originalRequest.method,
    headers,
    body: ['GET', 'HEAD'].includes(originalRequest.method) ? undefined : originalRequest.body,
    credentials: 'same-origin',
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });

  return observedSupabaseFetch(proxiedRequest, requestId);
}

async function observedSupabaseFetch(request: Request, requestId: string): Promise<Response> {
  const startedAt = performance.now();

  try {
    const response = await fetch(request);
    recordSupabaseFetchTelemetry(request, response, requestId, performance.now() - startedAt);
    return response;
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        requestId,
        service: 'supabase',
        method: request.method,
        status: 'network_error',
      },
      extra: {
        url: sanitizedUrl(request.url),
        durationMs: Math.round(performance.now() - startedAt),
      },
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
    Sentry.captureMessage('Supabase fetch failed', {
      ...baseContext,
      level: response.status >= 500 ? 'error' : 'warning',
    });
    return;
  }

  if (durationMs > SLOW_SUPABASE_REQUEST_THRESHOLD_MS) {
    Sentry.captureMessage('Slow Supabase request', {
      ...baseContext,
      level: 'warning',
    });
  }
}

function sanitizedUrl(value: string): string {
  const url = new URL(value, window.location.origin);
  return `${url.origin}${url.pathname}`;
}
