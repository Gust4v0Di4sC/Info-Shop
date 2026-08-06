import { Tables, TablesInsert, TablesUpdate } from '@app/core/supabase/database.types';

export type AdminRole = 'gerente' | 'vendedor' | 'estoquista';

export type Admin = Tables<'admins'>;
export type AdminInsert = TablesInsert<'admins'>;
export type AdminUpdate = TablesUpdate<'admins'>;

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  gerente: 'Gerente',
  vendedor: 'Vendedor',
  estoquista: 'Estoquista',
};

export const ADMIN_DEFAULT_ROUTE: Record<AdminRole, string> = {
  gerente: '/dash',
  vendedor: '/orders',
  estoquista: '/stock',
};

export const ADMIN_ROLE_ACCESS: Record<AdminRole, string[]> = {
  gerente: ['/dash', '/products', '/orders', '/stock', '/deliveries', '/offers', '/clients', '/customization', '/admin-profile'],
  vendedor: ['/orders', '/clients', '/deliveries', '/offers', '/customization', '/admin-profile'],
  estoquista: ['/stock', '/products', '/customization', '/admin-profile'],
};

export function normalizeAdminRole(role: string | null | undefined): AdminRole {
  return role === 'vendedor' || role === 'estoquista' ? role : 'gerente';
}
