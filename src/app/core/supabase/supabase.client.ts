import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';
import { Database } from './database.types';

const supabaseUrl = environment.supabaseUrl?.trim();
const supabaseAnonKey = environment.supabaseAnonKey?.trim();
const browserSessionStorage = typeof window !== 'undefined' ? window.sessionStorage : undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e anon key precisam estar configuradas no environment.');
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      ...(browserSessionStorage ? { storage: browserSessionStorage } : {}),
    },
  },
);
