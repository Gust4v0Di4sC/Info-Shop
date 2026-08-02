import { Injectable } from '@angular/core';
import { BehaviorSubject, from, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseList, throwSupabaseError } from '@app/core/supabase/supabase-response';
import { CartItemWithProduct } from '@app/models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartServiceService {
  private cartCount = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCount.asObservable();

  refreshCartCount(): Observable<number> {
    return from(this.loadCartCount());
  }

  getCartItems(): Observable<CartItemWithProduct[]> {
    return from(this.loadCartItems());
  }

  addProduct(productId: string | number, quantity = 1): Observable<void> {
    return from(this.addProductToCart(productId, quantity));
  }

  updateQuantity(itemId: string, quantity: number): Observable<void> {
    return from(this.updateItemQuantity(itemId, quantity));
  }

  removeItem(itemId: string): Observable<void> {
    return from(this.removeCartItem(itemId));
  }

  clearCart(): Observable<void> {
    return from(this.clearUserCart());
  }

  incrementCart() {
    this.cartCount.next(this.cartCount.value + 1);
  }

  private async getUserId(): Promise<string> {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    if (!data.user) {
      throw new Error('Entre na sua conta para usar o carrinho.');
    }

    const userId = data.user.id;
    await this.ensureUserProfile(userId, data.user.email || '');

    return userId;
  }

  private async ensureUserProfile(userId: string, email: string): Promise<void> {
    const result = await supabase
      .from('users')
      .upsert({ id: userId, email }, { onConflict: 'id' });

    throwSupabaseError(result);
  }

  private async loadCartCount(): Promise<number> {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      this.cartCount.next(0);
      return 0;
    }

    const result = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', data.user.id);

    const total = getSupabaseList(result).reduce((sum, item) => sum + item.quantity, 0);
    this.cartCount.next(total);
    return total;
  }

  private async loadCartItems(): Promise<CartItemWithProduct[]> {
    const userId = await this.getUserId();
    const cartResult = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const items = getSupabaseList(cartResult);
    const productIds = items.map(item => item.product_id);

    if (productIds.length === 0) {
      this.cartCount.next(0);
      return [];
    }

    const productsResult = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    const products = getSupabaseList(productsResult);
    const productsById = new Map(products.map(product => [String(product.id), product]));

    this.cartCount.next(items.reduce((sum, item) => sum + item.quantity, 0));

    return items.map(item => ({
      ...item,
      product: productsById.get(String(item.product_id)) || null,
    }));
  }

  private async addProductToCart(productId: string | number, quantity: number): Promise<void> {
    const userId = await this.getUserId();
    const normalizedProductId = String(productId);
    const productResult = await supabase
      .from('products')
      .select('id')
      .eq('id', normalizedProductId)
      .maybeSingle();

    if (productResult.error) {
      throw productResult.error;
    }

    if (!productResult.data) {
      throw new Error('Produto nao encontrado para adicionar ao carrinho.');
    }

    const existingResult = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', normalizedProductId)
      .maybeSingle();

    if (existingResult.error) {
      throw existingResult.error;
    }

    if (existingResult.data) {
      const updateResult = await supabase
        .from('cart_items')
        .update({ quantity: existingResult.data.quantity + quantity })
        .eq('id', existingResult.data.id);

      throwSupabaseError(updateResult);
    } else {
      const insertResult = await supabase
        .from('cart_items')
        .insert({ user_id: userId, product_id: normalizedProductId, quantity });

      throwSupabaseError(insertResult);
    }

    await this.loadCartCount();
  }

  private async updateItemQuantity(itemId: string, quantity: number): Promise<void> {
    const userId = await this.getUserId();

    if (quantity <= 0) {
      await this.removeCartItem(itemId);
      return;
    }

    const result = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('user_id', userId);

    throwSupabaseError(result);
    await this.loadCartCount();
  }

  private async removeCartItem(itemId: string): Promise<void> {
    const userId = await this.getUserId();
    const result = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);

    throwSupabaseError(result);
    await this.loadCartCount();
  }

  private async clearUserCart(): Promise<void> {
    const userId = await this.getUserId();
    const result = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId);

    throwSupabaseError(result);
    this.cartCount.next(0);
  }
}
