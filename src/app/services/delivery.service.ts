import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { Delivery, DeliveryUpdate } from '@app/models/delivery.model';
import { getSupabaseData, getSupabaseList } from '@app/core/supabase/supabase-response';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  getDeliveries(): Observable<Delivery[]> {
    return from(
      supabase
        .from('deliveries')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(
      map(getSupabaseList),
    );
  }

  updateDelivery(id: string, delivery: DeliveryUpdate): Observable<Delivery> {
    return from(
      supabase
        .from('deliveries')
        .update(delivery)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(getSupabaseData),
    );
  }
}
