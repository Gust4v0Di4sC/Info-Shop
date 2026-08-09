import { Tables } from '@app/core/supabase/database.types';
import { Order } from './order.model';
import { ShippingQuoteOption, DeliveryAddress } from './shipping.model';

export type Payment = Tables<'payments'>;

export interface PaymentPreferenceRequest {
  address: DeliveryAddress;
  selectedServiceId: string;
}

export interface PaymentPreferenceResult {
  order: Order;
  payment: Payment;
  quote: ShippingQuoteOption;
  initPoint: string;
  sandboxInitPoint: string | null;
}
