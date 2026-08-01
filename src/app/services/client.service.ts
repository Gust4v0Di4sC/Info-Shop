import { Injectable } from '@angular/core';
import { from, map, Observable } from 'rxjs';
import { Client, ClientInsert, ClientUpdate } from '@app/models/client.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData, getSupabaseList, throwSupabaseError } from '@app/core/supabase/supabase-response';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  searchClients(term: string): Observable<Client[]> {
    return from(
      supabase
        .from('clients')
        .select('*')
        .ilike('name', `%${term}%`)
    ).pipe(
      map(getSupabaseList)
    );
  }

  getClients(): Observable<Client[]> {
    return from(
      supabase
        .from('clients')
        .select('*')
    ).pipe(
      map(result =>
        getSupabaseList(result).filter(client => client.name && client.address)
      )
    );
  }

  getClient(id: string): Observable<Client> {
    return from(
      supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }

  createClient(client: ClientInsert): Observable<Client> {
    return from(
      supabase
        .from('clients')
        .insert(client)
        .select()
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }

  updateClient(id: string, client: ClientUpdate): Observable<Client> {
    return from(
      supabase
        .from('clients')
        .update(client)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }

  deleteClient(id: string): Observable<void> {
    return from(
      supabase
        .from('clients')
        .delete()
        .eq('id', id)
    ).pipe(
      map(throwSupabaseError)
    );
  }
}
