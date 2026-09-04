import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable, Injector, Optional, REQUEST } from '@angular/core';
import { from, map, Observable, switchMap, take } from 'rxjs';
import { Product } from '@app/models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly publicProductsUrl = '/api/public/products';

  constructor(
    private http: HttpClient,
    private injector: Injector,
    @Optional() @Inject(REQUEST) private request: Request | null,
  ) {}

  /**
   * Busca produtos por nome ou modelo usando Supabase
   */
  searchProducts(term: string): Observable<Product[]> {
    return from(this.adminDependencies()).pipe(
      switchMap(({ tenantContext, supabase, getSupabaseList }) => tenantContext.selectedStoreIdRequired$().pipe(
        take(1),
        switchMap(storeId => from(
          supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .or(`name.ilike.%${term}%,model.ilike.%${term}%`),
        )),
        map(getSupabaseList),
      )),
      map(products => products.filter(p => p.name && p.price != null && p.cost != null)),
    );
  }

  /**
   * Lista todos os produtos
   */
  getProducts(): Observable<Product[]> {
    return from(this.adminDependencies()).pipe(
      switchMap(({ tenantContext, supabase, getSupabaseList }) => tenantContext.selectedStoreIdRequired$().pipe(
        switchMap(storeId => from(
          supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId),
        )),
        map(result =>
          getSupabaseList(result).filter(p => p.name && p.price != null && p.cost != null)
        ),
      )),
    );
  }

  deleteProduct(id: string | number): Observable<void> {
    return from(this.adminDependencies()).pipe(
      switchMap(({ tenantContext, supabase, throwSupabaseError }) => tenantContext.selectedStoreIdRequired$().pipe(
        take(1),
        switchMap(storeId => from(
          supabase
            .from('products')
            .delete()
            .eq('id', Number(id))
            .eq('store_id', storeId),
        )),
        map(throwSupabaseError),
        map(() => undefined),
      )),
    );
  }

  getFeaturedProducts(limit = 4): Observable<Product[]> {
    const params = new HttpParams()
      .set('featured', 'true')
      .set('limit', String(limit));

    return this.http.get<Product[]>(this.publicProductsEndpoint(), { params });
  }

  getPublicCatalog(category?: string | null, searchTerm = ''): Observable<Product[]> {
    let params = new HttpParams().set('limit', '24');
    const query = searchTerm.trim();

    if (category) {
      params = params.set('category', category);
    }

    if (query) {
      params = params.set('q', query);
    }

    return this.http.get<Product[]>(this.publicProductsEndpoint(), { params });
  }

  getOfferProduct(): Observable<Product | null> {
    return this.http.get<Product | null>(this.publicProductsEndpoint('/offer'));
  }

  /**
   * Busca um produto por ID
   */
  getProduct(id: string | number): Observable<Product> {
    return this.http.get<Product>(this.publicProductsEndpoint(`/${encodeURIComponent(String(id))}`));
  }

  private publicProductsEndpoint(path = ''): string {
    const endpoint = `${this.publicProductsUrl}${path}`;

    return this.request ? new URL(endpoint, this.request.url).toString() : endpoint;
  }

  private async adminDependencies() {
    const [
      { supabase },
      { getSupabaseList, throwSupabaseError },
      { TenantContextService },
    ] = await Promise.all([
      import('@app/core/supabase/supabase.client'),
      import('@app/core/supabase/supabase-response'),
      import('@app/core/tenant/tenant-context.service'),
    ]);

    return {
      supabase,
      getSupabaseList,
      throwSupabaseError,
      tenantContext: this.injector.get(TenantContextService),
    };
  }
}
