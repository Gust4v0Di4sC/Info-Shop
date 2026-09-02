import { Injectable } from '@angular/core';
import { from, Observable, map, switchMap } from 'rxjs';
import { Order, OrderUpdate } from '@app/models/order.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData, getSupabaseList } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private tenantContext: TenantContextService) {}

  /** Buscar pedidos por termo (nome ou produto) */
  searchOrders(term: string): Observable<Order[]> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      switchMap(storeId => from(
        supabase
          .from('orders')
          .select('*')
          .eq('store_id', storeId)
          .or(`name.ilike.%${term}%,product.ilike.%${term}%`),
      )),
      map(getSupabaseList),
    );
  }

  /** Listar todos os pedidos */
  getOrders(): Observable<Order[]> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      switchMap(storeId => from(
        supabase
          .from('orders')
          .select('*')
          .eq('store_id', storeId),
      )),
      map(result =>
        getSupabaseList(result).filter(order => order.name && order.product)
      ),
    );
  }

  /** Buscar pedido por ID */
  getOrder(id: string | number): Observable<Order> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('orders')
          .select('*')
          .eq('id', Number(id))
          .eq('store_id', storeId)
          .single(),
      )),
      map(getSupabaseData),
    );
  }

  /** Cancelar pedido sem remover o registro */
  cancelOrder(id: string | number): Observable<Order> {
    const update: OrderUpdate = { status: 'canceled' };

    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('orders')
          .update(update)
          .eq('id', Number(id))
          .eq('store_id', storeId)
          .select()
          .single(),
      )),
      map(getSupabaseData),
    );
  }
}
