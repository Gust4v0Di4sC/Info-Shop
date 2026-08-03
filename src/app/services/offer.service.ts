import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { Product } from '@app/models/product.model';
import { getSupabaseData, getSupabaseList, throwSupabaseError } from '@app/core/supabase/supabase-response';

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
  getProducts(): Observable<Product[]> {
    return from(
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(
      map(getSupabaseList),
    );
  }

  getActiveOffer(): Observable<Product | null> {
    return from(this.loadActiveOffer());
  }

  setActiveOffer(productId: string, settings: OfferSettings): Observable<Product> {
    return from(this.saveActiveOffer(productId, settings));
  }

  clearOffer(): Observable<void> {
    return from(
      supabase
        .rpc('clear_active_offer')
    ).pipe(
      map(throwSupabaseError),
    );
  }

  updateFeatured(productId: string, isFeatured: boolean): Observable<Product> {
    return from(
      supabase
        .rpc('set_product_featured', {
          product_id: productId,
          featured: isFeatured,
        })
    ).pipe(
      map(getSupabaseData),
    );
  }

  private async loadActiveOffer(): Promise<Product | null> {
    const result = await supabase
      .from('products')
      .select('*')
      .eq('is_offer', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    return result.data;
  }

  private async saveActiveOffer(productId: string, settings: OfferSettings): Promise<Product> {
    return getSupabaseData(await supabase
      .rpc('set_active_offer', {
        product_id: productId,
        offer_price_value: settings.offer_price,
        offer_badge_value: settings.offer_badge,
        offer_ends_at_value: settings.offer_ends_at,
        offer_sold_percent_value: settings.offer_sold_percent,
      }));
  }
}
