import { Tables, TablesInsert, TablesUpdate } from '@app/core/supabase/database.types';

export type Product = Tables<'products'>;
export type ProductInsert = TablesInsert<'products'>;
export type ProductUpdate = TablesUpdate<'products'>;
