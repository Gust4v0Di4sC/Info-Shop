import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { Product } from '@app/models/product.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData, getSupabaseList, throwSupabaseError } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  constructor(private tenantContext: TenantContextService) {}

  /**
   * Busca produtos por nome ou modelo usando Supabase
   */
  searchProducts(term: string): Observable<Product[]> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      switchMap(storeId => from(
        supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .or(`name.ilike.%${term}%,model.ilike.%${term}%`),
      )),
      map(getSupabaseList),
    ).pipe(
      map(products => products.filter(p => p.name && p.price != null && p.cost != null)),
    );
  }

  /**
   * Lista todos os produtos
   */
  getProducts(): Observable<Product[]> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      switchMap(storeId => from(
        supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId),
      )),
      map(result =>
        getSupabaseList(result).filter(p => p.name && p.price != null && p.cost != null)
      ),
    );
  }

  getFeaturedProducts(limit = 4): Observable<Product[]> {
    return from(
      supabase
        .from('products')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(getSupabaseList)
    );
  }

  getPublicCatalog(category?: string | null): Observable<Product[]> {
    let query = supabase
      .from('products')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    return from(query).pipe(
      map(getSupabaseList),
      map(products => products.filter(product => product.name && product.price != null)),
    );
  }

  getOfferProduct(): Observable<Product | null> {
    return from(
      supabase
        .from('products')
        .select('*')
        .eq('is_offer', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }

        return data;
      }),
    );
  }

  /**
   * Busca um produto por ID
   */
  getProduct(id: string | number): Observable<Product> {
    return from(
      supabase
        .from('products')
        .select('*')
        .eq('id', Number(id))
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }

  /**
   * Deleta um produto por ID
   */
  deleteProduct(id: string | number): Observable<void> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      switchMap(storeId => from(
        supabase
          .from('products')
          .delete()
          .eq('id', Number(id))
          .eq('store_id', storeId),
      )),
      map(throwSupabaseError),
    ).pipe(
      map(() => undefined),
    );
  }
}
