import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Product } from '@app/models/product.model';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl = `${environment.supabaseUrl}/rest/v1/products`;

  private httpOptions = {
    headers: new HttpHeaders({
      apikey: environment.supabaseAnonKey,
      Authorization: `Bearer ${environment.supabaseAnonKey}`,
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Busca produtos por nome ou modelo usando Supabase
   */
  searchProducts(term: string): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.apiUrl}?or=(name.ilike.%${term}%,model.ilike.%${term}%)&select=*`,
      this.httpOptions
    );
  }

  /**
   * Lista todos os produtos
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(
      `${this.apiUrl}?select=*`,
      this.httpOptions
    ).pipe(
      map(products =>
        products.filter(p => p.name && p.price != null && p.cost != null)
      )
    );
  }

  /**
   * Busca um produto por ID
   */
  getProduct(id: string): Observable<Product> {
    return this.http.get<Product[]>(
      `${this.apiUrl}?id=eq.${id}&select=*`,
      this.httpOptions
    ).pipe(
      map(res => res[0])
    );
  }

  /**
   * Deleta um produto por ID
   */
  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}?id=eq.${id}`,
      this.httpOptions
    );
  }
}
