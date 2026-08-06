import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { Delivery, DeliveryUpdate } from '@app/models/delivery.model';
import { getSupabaseData, getSupabaseList } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  constructor(private tenantContext: TenantContextService) {}

  getDeliveries(): Observable<Delivery[]> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      switchMap(storeId => from(
        supabase
          .from('deliveries')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false }),
      )),
      map(getSupabaseList),
    );
  }

  updateDelivery(id: string, delivery: DeliveryUpdate): Observable<Delivery> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('deliveries')
          .update(delivery)
          .eq('id', id)
          .eq('store_id', storeId)
          .select()
          .single(),
      )),
      map(getSupabaseData),
    );
  }
}
