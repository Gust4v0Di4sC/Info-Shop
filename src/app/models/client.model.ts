import { Tables, TablesInsert, TablesUpdate } from '@app/core/supabase/database.types';

export type Client = Tables<'clients'>;
export type ClientInsert = TablesInsert<'clients'>;
export type ClientUpdate = TablesUpdate<'clients'>;
