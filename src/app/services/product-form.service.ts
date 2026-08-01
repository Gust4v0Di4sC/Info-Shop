import { Injectable } from '@angular/core';
import { from, Observable, switchMap, map } from 'rxjs';
import { Product, ProductInsert, ProductUpdate } from '@app/models/product.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData } from '@app/core/supabase/supabase-response';

@Injectable({
  providedIn: 'root'
})
export class ProductFormService {

  /** Upload da imagem no bucket "products" */
  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const fileName = `${Date.now()}_${file.name}`;

    return from(
      supabase.storage
        .from('products')
        .upload(fileName, file, { upsert: true })
    ).pipe(
      switchMap(({ error }) => {
        if (error) throw error;

        const publicUrl = supabase.storage
          .from('products')
          .getPublicUrl(fileName).data.publicUrl;

        return from([{ imageUrl: publicUrl }]);
      })
    );
  }

  /** Criar produto */
  createProduct(product: ProductInsert): Observable<Product> {
    return from(
      supabase
        .from('products')
        .insert(product)
        .select()
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }

  /** Buscar por ID */
  getProductById(id: string): Observable<Product> {
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

  /** Atualizar */
  updateProduct(id: string, productData: ProductUpdate): Observable<Product> {
    return from(
      supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }
}
