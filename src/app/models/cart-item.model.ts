import { Product } from './product.model';
import { Tables, TablesInsert, TablesUpdate } from '@app/core/supabase/database.types';

export type CartItem = Tables<'cart_items'>;
export type CartItemInsert = TablesInsert<'cart_items'>;
export type CartItemUpdate = TablesUpdate<'cart_items'>;
export type CartProduct = Pick<
  Product,
  'id' | 'name' | 'model' | 'description' | 'imageUrl' | 'price' | 'offer_price'
>;

export type CartItemWithProduct = CartItem & {
  product: CartProduct | null;
};
