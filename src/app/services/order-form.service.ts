import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { supabase } from '@app/services/supabase.client';
import { Order } from '@app/models/order.model';
import { Product } from '@app/models/product.model';
import { Client } from '@app/models/client.model';

@Injectable({
  providedIn: 'root'
})
export class OrderFormService {

  getClients(): Observable<Client[]> {
    return from(
      supabase
        .from('clients')
        .select('*')
        .then(({ data, error }) => {
          if (error) throw error;
          return data || [];
        })
    );
  }

  getProducts(): Observable<Product[]> {
    return from(
      supabase
        .from('products')
        .select('*')
        .then(({ data, error }) => {
          if (error) throw error;
          return data || [];
        })
    );
  }

  createOrder(order: Omit<Order, 'id'>): Observable<Order> {
    return from(
      supabase
        .from('orders')
        .insert(order)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data as Order;
        })
    );
  }

  getOrderById(id: string): Observable<Order> {
    return from(
      supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data as Order;
        })
    );
  }

  updateOrder(id: string, orderData: Partial<Order>): Observable<Order> {
    return from(
      supabase
        .from('orders')
        .update(orderData)
        .eq('id', id)
        .select()
        .single()
        .then(({ data, error }) => {
          if (error) throw error;
          return data as Order;
        })
    );
  }
}
