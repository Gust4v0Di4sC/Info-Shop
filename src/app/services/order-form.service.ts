import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { Order, OrderInsert, OrderUpdate } from '@app/models/order.model';
import { Product } from '@app/models/product.model';
import { Client } from '@app/models/client.model';
import { getSupabaseData, getSupabaseList } from '@app/core/supabase/supabase-response';

@Injectable({
  providedIn: 'root'
})
export class OrderFormService {

  getClients(): Observable<Client[]> {
    return from(
      supabase
        .from('clients')
        .select('*')
    ).pipe(
      map(getSupabaseList)
    );
  }

  getProducts(): Observable<Product[]> {
    return from(
      supabase
        .from('products')
        .select('*')
    ).pipe(
      map(getSupabaseList)
    );
  }

  createOrder(order: OrderInsert): Observable<Order> {
    return from(
      supabase
        .from('orders')
        .insert(order)
        .select()
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }

  getOrderById(id: string): Observable<Order> {
    return from(
      supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }

  updateOrder(id: string, orderData: OrderUpdate): Observable<Order> {
    return from(
      supabase
        .from('orders')
        .update(orderData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }
}
