import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Client } from '../models/client.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private apiUrl = `${environment.supabaseUrl}/rest/v1/clients`;

  private httpOptions = {
    headers: new HttpHeaders({
      'apikey': environment.supabaseAnonKey,
      'Authorization': `Bearer ${environment.supabaseAnonKey}`,
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  searchClients(term: string): Observable<Client[]> {
    return this.http.get<Client[]>(
      `${this.apiUrl}?name=ilike.%${term}%&select=*`,
      this.httpOptions
    );
  }

  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(
      `${this.apiUrl}?select=*`,
      this.httpOptions
    ).pipe(
      map(clients => clients.filter(client => client.name && client.address))
    );
  }

  getClient(id: string): Observable<Client> {
    return this.http.get<Client[]>(
      `${this.apiUrl}?id=eq.${id}&select=*`,
      this.httpOptions
    ).pipe(
      map(res => res[0])
    );
  }

  createClient(client: Client): Observable<Client> {
    return this.http.post<Client[]>(
      `${this.apiUrl}?select=*`,
      client,
      this.httpOptions
    ).pipe(
      map(res => res[0])
    );
  }

  updateClient(id: string, client: Client): Observable<Client> {
    return this.http.patch<Client[]>(
      `${this.apiUrl}?id=eq.${id}&select=*`,
      client,
      this.httpOptions
    ).pipe(
      map(res => res[0])
    );
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}?id=eq.${id}`,
      this.httpOptions
    );
  }
}
