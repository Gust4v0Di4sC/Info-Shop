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
