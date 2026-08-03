import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { Product, ProductUpdate } from '@app/models/product.model';
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
        .from('products')
        .update({ is_offer: false })
        .eq('is_offer', true)
    ).pipe(
      map(throwSupabaseError),
    );
  }

  updateFeatured(productId: string, isFeatured: boolean): Observable<Product> {
    const update: ProductUpdate = { is_featured: isFeatured };

    return from(
      supabase
        .from('products')
        .update(update)
        .eq('id', productId)
        .select()
        .single()
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
    const clearResult = await supabase
      .from('products')
      .update({ is_offer: false })
      .eq('is_offer', true);

    throwSupabaseError(clearResult);

    const update: ProductUpdate = {
      is_offer: true,
      is_featured: true,
      offer_price: settings.offer_price,
      offer_badge: settings.offer_badge,
      offer_ends_at: settings.offer_ends_at,
      offer_sold_percent: settings.offer_sold_percent,
    };

    return getSupabaseData(await supabase
      .from('products')
      .update(update)
      .eq('id', productId)
      .select()
      .single());
  }
}
