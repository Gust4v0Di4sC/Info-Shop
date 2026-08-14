import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { Database } from './database.types';

const supabaseUrl = environment.supabaseUrl?.trim();
const supabaseAnonKey = environment.supabaseAnonKey?.trim();
const isBrowser = typeof window !== 'undefined';
const runtimeSupabaseUrl = supabaseUrl || (isBrowser ? '' : 'https://example.supabase.co');
const runtimeSupabaseAnonKey = supabaseAnonKey || (isBrowser ? '' : 'anon-key');

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
  headers.delete('authorization');
  headers.delete('apikey');

  return fetch(`/api/supabase${url.pathname}${url.search}`, {
    method: originalRequest.method,
    headers,
    body: ['GET', 'HEAD'].includes(originalRequest.method) ? undefined : originalRequest.body,
    credentials: 'same-origin',
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
}
