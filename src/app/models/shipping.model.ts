import { Delivery } from './delivery.model';
import { Order } from './order.model';

export interface DeliveryAddress {
  postalCode: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string | null;
}

export interface ShippingQuoteOption {
  id: string;
  name: string;
  company: string;
  price: number;
  deliveryTime: number | null;
  raw?: unknown;
}

export interface ShippingQuoteResponse {
  quotes: ShippingQuoteOption[];
}

export interface CheckoutRequest {
  address: DeliveryAddress;
  selectedServiceId: string;
}

export interface CheckoutResult {
  order: Order;
  delivery: Delivery;
  quote: ShippingQuoteOption;
}
