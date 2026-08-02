import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment.prod';
import { Database } from './database.types';

const supabaseUrl = environment.supabaseUrl || 'http://localhost:54321';
const supabaseAnonKey = environment.supabaseAnonKey || 'local-development-key';
const browserSessionStorage = typeof window !== 'undefined' ? window.sessionStorage : undefined;

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
