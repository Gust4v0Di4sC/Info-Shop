import { Tables, TablesInsert, TablesUpdate } from '@app/core/supabase/database.types';

export type Delivery = Tables<'deliveries'>;
export type DeliveryInsert = TablesInsert<'deliveries'>;
export type DeliveryUpdate = TablesUpdate<'deliveries'>;

export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  preparing: 'Em preparo',
  shipped: 'Enviado',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  canceled: 'Cancelado',
};
