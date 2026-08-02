import { Tables, TablesInsert, TablesUpdate } from '@app/core/supabase/database.types';

export type Admin = Tables<'admins'>;
export type AdminInsert = TablesInsert<'admins'>;
export type AdminUpdate = TablesUpdate<'admins'>;
