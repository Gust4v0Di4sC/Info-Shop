import { Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { Delivery } from '@app/models/delivery.model';
import { Order } from '@app/models/order.model';
import { Product } from '@app/models/product.model';
import { getSupabaseList } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

export interface ProductSalesMetric {
  productId: number | null;
  productName: string;
  quantitySold: number;
  revenue: number;
}

export interface ProductMovementMetric {
  productId: number;
  productName: string;
  quantitySold: number;
  stockQuantity: number;
  stockReserved: number;
}

export interface MonthlyRevenueMetric {
  period: string;
  orders: number;
  revenue: number;
}

export interface StatusMetric {
  status: string;
  label: string;
  total: number;
}

export interface CategoryInventoryMetric {
  category: string;
  products: number;
  units: number;
}

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
  analytics: {
    averageTicket: number;
    salesByProduct: ProductSalesMetric[];
    slowMovingProducts: ProductMovementMetric[];
    revenueByMonth: MonthlyRevenueMetric[];
    ordersByStatus: StatusMetric[];
    inventoryByCategory: CategoryInventoryMetric[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  constructor(private tenantContext: TenantContextService) {}

  getOverview(): Observable<AdminOverview> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      switchMap(storeId => from(this.loadOverview(storeId))),
    );
  }

  private async loadOverview(storeId: string): Promise<AdminOverview> {
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
      supabase.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      this.countRows('clients', query => query.eq('store_id', storeId)),
      this.countRows('users'),
      supabase.from('orders').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      this.countRows('orders', query => query.eq('store_id', storeId).neq('status', 'delivered').neq('status', 'canceled')),
      supabase.from('deliveries').select('*').eq('store_id', storeId).order('created_at', { ascending: false }).limit(6),
      this.countRows('cart_items'),
      supabase
        .from('products')
        .select('*')
        .eq('is_offer', true)
        .eq('store_id', storeId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const products = getSupabaseList(productsResult);
    const orders = getSupabaseList(ordersResult);
    const salesOrders = orders.filter(order => order.status !== 'canceled');
    const recentOrders = orders.slice(0, 6);
    const deliveryQueue = getSupabaseList(deliveriesResult);
    const revenue = salesOrders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

    if (offerResult.error) {
      throw offerResult.error;
    }

    return {
      totals: {
        products: products.length,
        clients: clientsCount,
        users: usersCount,
        orders: orders.length,
        openOrders: openOrdersCount,
        deliveries: await this.countRows('deliveries', query => query.eq('store_id', storeId)),
        cartItems: cartCount,
        inventoryUnits: products.reduce((sum, product) => sum + product.stock_quantity, 0),
      },
      revenue,
      lowStockProducts: products
        .filter(product => product.stock_quantity <= product.stock_minimum)
        .slice(0, 5),
      recentOrders,
      activeOffer: offerResult.data,
      deliveryQueue,
      analytics: {
        averageTicket: salesOrders.length ? revenue / salesOrders.length : 0,
        salesByProduct: this.buildSalesByProduct(salesOrders).slice(0, 8),
        slowMovingProducts: this.buildSlowMovingProducts(products, salesOrders).slice(0, 8),
        revenueByMonth: this.buildRevenueByMonth(salesOrders),
        ordersByStatus: this.buildOrdersByStatus(orders),
        inventoryByCategory: this.buildInventoryByCategory(products),
      },
    };
  }

  private buildSalesByProduct(orders: Order[]): ProductSalesMetric[] {
    const metrics = new Map<string, ProductSalesMetric>();

    for (const order of orders) {
      const productName = order.product || 'Produto sem nome';
      const key = String(order.productId ?? productName);
      const current = metrics.get(key) || {
        productId: order.productId,
        productName,
        quantitySold: 0,
        revenue: 0,
      };

      current.quantitySold += Number(order.quantity || 0);
      current.revenue += Number(order.total_amount || 0);
      metrics.set(key, current);
    }

    return Array.from(metrics.values()).sort((a, b) => b.quantitySold - a.quantitySold);
  }

  private buildSlowMovingProducts(products: Product[], orders: Order[]): ProductMovementMetric[] {
    const soldByProductId = new Map<number, number>();

    for (const order of orders) {
      if (order.productId === null) {
        continue;
      }

      soldByProductId.set(
        order.productId,
        (soldByProductId.get(order.productId) || 0) + Number(order.quantity || 0),
      );
    }

    return products
      .map(product => ({
        productId: product.id,
        productName: product.name,
        quantitySold: soldByProductId.get(product.id) || 0,
        stockQuantity: product.stock_quantity,
        stockReserved: product.stock_reserved,
      }))
      .sort((a, b) => a.quantitySold - b.quantitySold || b.stockQuantity - a.stockQuantity);
  }

  private buildRevenueByMonth(orders: Order[]): MonthlyRevenueMetric[] {
    const now = new Date();
    const periods = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const key = this.monthKey(date);

      return {
        key,
        metric: {
          period: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', ''),
          orders: 0,
          revenue: 0,
        },
      };
    });
    const metrics = new Map(periods.map(period => [period.key, period.metric]));

    for (const order of orders) {
      if (!order.created_at) {
        continue;
      }

      const orderDate = new Date(order.created_at);
      const metric = metrics.get(this.monthKey(orderDate));

      if (!metric) {
        continue;
      }

      metric.orders += 1;
      metric.revenue += Number(order.total_amount || 0);
    }

    return periods.map(period => period.metric);
  }

  private buildOrdersByStatus(orders: Order[]): StatusMetric[] {
    const metrics = new Map<string, StatusMetric>();

    for (const order of orders) {
      const current = metrics.get(order.status) || {
        status: order.status,
        label: this.orderStatusLabel(order.status),
        total: 0,
      };

      current.total += 1;
      metrics.set(order.status, current);
    }

    return Array.from(metrics.values()).sort((a, b) => b.total - a.total);
  }

  private buildInventoryByCategory(products: Product[]): CategoryInventoryMetric[] {
    const metrics = new Map<string, CategoryInventoryMetric>();

    for (const product of products) {
      const category = product.category || 'Sem categoria';
      const current = metrics.get(category) || {
        category,
        products: 0,
        units: 0,
      };

      current.products += 1;
      current.units += product.stock_quantity;
      metrics.set(category, current);
    }

    return Array.from(metrics.values()).sort((a, b) => b.units - a.units).slice(0, 6);
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private orderStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: 'Aberto',
      payment_pending: 'Aguardando pagamento',
      payment_failed: 'Pagamento não aprovado',
      confirmed: 'Confirmado',
      preparing: 'Em preparo',
      shipped: 'Enviado',
      delivered: 'Entregue',
      canceled: 'Cancelado',
    };

    return labels[status] || status;
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
