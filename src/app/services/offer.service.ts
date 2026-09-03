import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap, take } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { Product } from '@app/models/product.model';
import { getSupabaseData, getSupabaseList, throwSupabaseError } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

export interface OfferSettings {
  offer_price: number | null;
  offer_badge: string;
  offer_ends_at: string | null;
  offer_sold_percent: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfferService {
  constructor(private tenantContext: TenantContextService) {}

  getProducts(): Observable<Product[]> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      take(1),
      switchMap(storeId => from(
        supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .order('created_at', { ascending: false }),
      )),
      map(getSupabaseList),
    );
  }

  getActiveOffer(): Observable<Product | null> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      take(1),
      switchMap(storeId => from(this.loadActiveOffer(storeId))),
    );
  }

  setActiveOffer(productId: string | number, settings: OfferSettings): Observable<Product> {
    return from(this.saveActiveOffer(productId, settings));
  }

  clearOffer(): Observable<void> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .rpc('clear_active_offer', {
            store_id_value: storeId,
          }),
      )),
      map(throwSupabaseError),
    ).pipe(
      map(() => undefined),
    );
  }

  updateFeatured(productId: string | number, isFeatured: boolean): Observable<Product> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .rpc('set_product_featured', {
            product_id: String(productId),
            featured: isFeatured,
            store_id_value: storeId,
          }),
      )),
      map(getSupabaseData),
    );
  }

  private async loadActiveOffer(storeId: string): Promise<Product | null> {
    const result = await supabase
      .from('products')
      .select('*')
      .eq('is_offer', true)
      .eq('store_id', storeId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  private async saveActiveOffer(productId: string | number, settings: OfferSettings): Promise<Product> {
    const storeId = await this.tenantContext.getSelectedStoreId();

    return getSupabaseData(await supabase
      .rpc('set_active_offer', {
        product_id: String(productId),
        offer_price_value: settings.offer_price,
        offer_badge_value: settings.offer_badge,
        offer_ends_at_value: settings.offer_ends_at,
        offer_sold_percent_value: settings.offer_sold_percent,
        store_id_value: storeId,
      } as any));
  }
}
