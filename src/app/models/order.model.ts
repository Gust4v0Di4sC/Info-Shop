import { Tables, TablesInsert, TablesUpdate } from '@app/core/supabase/database.types';

export type Order = Tables<'orders'>;
export type OrderInsert = TablesInsert<'orders'>;
export type OrderUpdate = TablesUpdate<'orders'>;
