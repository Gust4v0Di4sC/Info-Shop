import { Injectable } from '@angular/core';
import { from, Observable, map } from 'rxjs';
import { Order } from '@app/models/order.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData, getSupabaseList, throwSupabaseError } from '@app/core/supabase/supabase-response';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  /** Buscar pedidos por termo (nome ou produto) */
  searchOrders(term: string): Observable<Order[]> {
    return from(
      supabase
        .from('orders')
        .select('*')
        .or(`name.ilike.%${term}%,product.ilike.%${term}%`)
    ).pipe(
      map(getSupabaseList)
    );
  }

  /** Listar todos os pedidos */
  getOrders(): Observable<Order[]> {
    return from(
      supabase
        .from('orders')
        .select('*')
    ).pipe(
      map(result =>
        getSupabaseList(result).filter(order => order.name && order.product)
      )
    );
  }

  /** Buscar pedido por ID */
  getOrder(id: string): Observable<Order> {
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

  /** Deletar pedido */
  deleteOrder(id: string): Observable<void> {
    return from(
      supabase
        .from('orders')
        .delete()
        .eq('id', id)
    ).pipe(
      map(throwSupabaseError)
    );
  }
}
