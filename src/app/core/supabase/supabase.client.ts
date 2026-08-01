import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment.prod';
import { Database } from './database.types';

const supabaseUrl = environment.supabaseUrl || 'http://localhost:54321';
const supabaseAnonKey = environment.supabaseAnonKey || 'local-development-key';
const hasSupabaseConfig = Boolean(environment.supabaseUrl && environment.supabaseAnonKey);

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: hasSupabaseConfig,
      autoRefreshToken: hasSupabaseConfig,
      detectSessionInUrl: hasSupabaseConfig,
      flowType: 'implicit',
    },
  },
);
