import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

interface RateLimitOptions {
  scope: string;
  subject: string;
  maxRequests: number;
  windowSeconds: number;
}

export async function assertRateLimit(
  serviceClient: SupabaseClient,
  options: RateLimitOptions,
): Promise<void> {
  const subjectHash = await sha256Hex(`${options.scope}:${options.subject}`);
  const { data, error } = await serviceClient.rpc('check_edge_rate_limit', {
    scope_value: options.scope,
    subject_hash_value: subjectHash,
    max_requests_value: options.maxRequests,
    window_seconds_value: options.windowSeconds,
  });

  if (error) {
    throw error;
  }

  if (data !== true) {
    throw new Error('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
  }
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown';
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}
