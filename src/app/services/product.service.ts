import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { Product } from '@app/models/product.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData, getSupabaseList, throwSupabaseError } from '@app/core/supabase/supabase-response';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  /**
   * Busca produtos por nome ou modelo usando Supabase
   */
  searchProducts(term: string): Observable<Product[]> {
    return from(
      supabase
        .from('products')
        .select('*')
        .or(`name.ilike.%${term}%,model.ilike.%${term}%`)
    ).pipe(
      map(getSupabaseList)
    );
  }

  /**
   * Lista todos os produtos
   */
  getProducts(): Observable<Product[]> {
    return from(
      supabase
        .from('products')
        .select('*')
    ).pipe(
      map(result =>
        getSupabaseList(result).filter(p => p.name && p.price != null && p.cost != null)
      )
    );
  }

  getFeaturedProducts(limit = 4): Observable<Product[]> {
    return from(
      supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
    ).pipe(
      map(getSupabaseList)
    );
  }

  /**
   * Busca um produto por ID
   */
  getProduct(id: string): Observable<Product> {
    return from(
      supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }

  /**
   * Deleta um produto por ID
   */
  deleteProduct(id: string): Observable<void> {
    return from(
      supabase
        .from('products')
        .delete()
        .eq('id', id)
    ).pipe(
      map(throwSupabaseError)
    );
  }
}
