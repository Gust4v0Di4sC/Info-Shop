import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { Delivery } from '@app/models/delivery.model';
import { Order } from '@app/models/order.model';
import { Product } from '@app/models/product.model';
import { getSupabaseList } from '@app/core/supabase/supabase-response';

export interface AdminOverview {
  totals: {
    products: number;
    clients: number;
    users: number;
    orders: number;
    openOrders: number;
    deliveries: number;
    cartItems: number;
    inventoryUnits: number;
  };
  revenue: number;
  lowStockProducts: Product[];
  recentOrders: Order[];
  activeOffer: Product | null;
  deliveryQueue: Delivery[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  getOverview(): Observable<AdminOverview> {
    return from(this.loadOverview());
  }

  private async loadOverview(): Promise<AdminOverview> {
    const [
      productsResult,
      clientsCount,
      usersCount,
      ordersResult,
      openOrdersCount,
      deliveriesResult,
      cartCount,
      offerResult,
    ] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      this.countRows('clients'),
      this.countRows('users'),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(6),
      this.countRows('orders', query => query.neq('status', 'delivered').neq('status', 'canceled')),
      supabase.from('deliveries').select('*').order('created_at', { ascending: false }).limit(6),
      this.countRows('cart_items'),
      supabase
        .from('products')
        .select('*')
        .eq('is_offer', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const products = getSupabaseList(productsResult);
    const recentOrders = getSupabaseList(ordersResult);
    const deliveryQueue = getSupabaseList(deliveriesResult);

    if (offerResult.error) {
      throw offerResult.error;
    }

    return {
      totals: {
        products: products.length,
        clients: clientsCount,
        users: usersCount,
        orders: await this.countRows('orders'),
        openOrders: openOrdersCount,
        deliveries: await this.countRows('deliveries'),
        cartItems: cartCount,
        inventoryUnits: products.reduce((sum, product) => sum + product.stock_quantity, 0),
      },
      revenue: recentOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      lowStockProducts: products
        .filter(product => product.stock_quantity <= product.stock_minimum)
        .slice(0, 5),
      recentOrders,
      activeOffer: offerResult.data,
      deliveryQueue,
    };
  }

  private async countRows(
    table: 'clients' | 'users' | 'orders' | 'deliveries' | 'cart_items',
    refine?: (query: any) => any,
  ): Promise<number> {
    const baseQuery = supabase.from(table).select('*', { count: 'exact', head: true });
    const result = await (refine ? refine(baseQuery) : baseQuery);

    if (result.error) {
      throw result.error;
    }

    return result.count || 0;
  }
}
