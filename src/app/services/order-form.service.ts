import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { Order, OrderInsert, OrderUpdate } from '@app/models/order.model';
import { Product } from '@app/models/product.model';
import { Client } from '@app/models/client.model';
import { getSupabaseData, getSupabaseList } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

@Injectable({
  providedIn: 'root'
})
export class OrderFormService {
  constructor(private tenantContext: TenantContextService) {}

  getClients(): Observable<Client[]> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('clients')
          .select('*')
          .eq('store_id', storeId),
      )),
      map(getSupabaseList),
    );
  }

  getProducts(): Observable<Product[]> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId),
      )),
      map(getSupabaseList),
    );
  }

  createOrder(order: OrderInsert): Observable<Order> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('orders')
          .insert({ ...order, store_id: storeId })
          .select()
          .single(),
      )),
      map(getSupabaseData),
    );
  }

  getOrderById(id: string | number): Observable<Order> {
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

  updateOrder(id: string | number, orderData: OrderUpdate): Observable<Order> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('orders')
          .update(orderData)
          .eq('id', Number(id))
          .eq('store_id', storeId)
          .select()
          .single(),
      )),
      map(getSupabaseData),
    );
  }
}
