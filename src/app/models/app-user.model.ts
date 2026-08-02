import { Tables, TablesInsert, TablesUpdate } from '@app/core/supabase/database.types';

export type AppUser = Tables<'users'>;
export type AppUserInsert = TablesInsert<'users'>;
export type AppUserUpdate = TablesUpdate<'users'>;
