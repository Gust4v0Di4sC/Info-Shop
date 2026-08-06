import { Injectable } from '@angular/core';
import { from, Observable, switchMap, map } from 'rxjs';
import { Product, ProductInsert, ProductUpdate } from '@app/models/product.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

@Injectable({
  providedIn: 'root'
})
export class ProductFormService {
  constructor(private tenantContext: TenantContextService) {}

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
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('products')
          .insert({ ...product, store_id: storeId })
          .select()
          .single(),
      )),
      map(getSupabaseData),
    ).pipe(
      map(productResult => productResult),
    );
  }

  /** Buscar por ID */
  getProductById(id: string): Observable<Product> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .eq('store_id', storeId)
          .single(),
      )),
      map(getSupabaseData),
    );
  }

  /** Atualizar */
  updateProduct(id: string, productData: ProductUpdate): Observable<Product> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('products')
          .update(productData)
          .eq('id', id)
          .eq('store_id', storeId)
          .select()
          .single(),
      )),
      map(getSupabaseData),
    );
  }
}
