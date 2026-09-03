import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap, take, timeout } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { AuthService } from '@app/core/auth/auth.service';
import { Delivery, DeliveryUpdate } from '@app/models/delivery.model';
import { getSupabaseData, getSupabaseList } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private readonly currentUserDeliverySelect = [
    'id',
    'order_id',
    'user_id',
    'store_id',
    'status',
    'address',
    'carrier',
    'tracking_code',
    'created_at',
    'estimated_delivery_date',
    'melhor_envio_protocol',
    'selected_service_name',
    'shipping_price',
    'shipping_deadline',
    'tracking_url',
    'label_status',
  ].join(', ');

  constructor(
    private tenantContext: TenantContextService,
    private authService: AuthService,
  ) {}

  getDeliveries(): Observable<Delivery[]> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      take(1),
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

  getCurrentUserDeliveries(): Observable<Delivery[]> {
    return from(this.loadCurrentUserDeliveries()).pipe(timeout({ first: 4000 }));
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

  private async loadCurrentUserDeliveries(): Promise<Delivery[]> {
    const user = await this.authService.requireCurrentUser('Entre na sua conta para acompanhar entregas.');

    const result = await supabase
      .from('deliveries')
      .select(this.currentUserDeliverySelect)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(25);

    return getSupabaseList(result) as unknown as Delivery[];
  }
}
