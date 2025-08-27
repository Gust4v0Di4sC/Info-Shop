import { Injectable } from '@angular/core';
import { from, Observable, map } from 'rxjs';
import { Order } from '../models/order.model';
import { supabase } from '../../supabase.client';

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
      map(({ data, error }) => {
        if (error) throw error;
        return data || [];
      })
    );
  }

  /** Listar todos os pedidos */
  getOrders(): Observable<Order[]> {
    return from(
      supabase
        .from('orders')
        .select('*')
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data || []).filter(order => order.name && order.product);
      })
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
      map(({ data, error }) => {
        if (error) throw error;
        return data as Order;
      })
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
      map(({ error }) => {
        if (error) throw error;
        return;
      })
    );
  }
}
