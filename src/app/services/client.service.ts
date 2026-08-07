import { Injectable } from '@angular/core';
import { from, map, Observable, switchMap } from 'rxjs';
import { Client, ClientInsert, ClientUpdate } from '@app/models/client.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData, getSupabaseList, throwSupabaseError } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  constructor(private tenantContext: TenantContextService) {}

  searchClients(term: string): Observable<Client[]> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      switchMap(storeId => from(
        supabase
          .from('clients')
          .select('*')
          .eq('store_id', storeId)
          .or(`name.ilike.%${term}%,email.ilike.%${term}%`),
      )),
      map(getSupabaseList),
    );
  }

  getClients(): Observable<Client[]> {
    return this.tenantContext.selectedStoreIdRequired$().pipe(
      switchMap(storeId => from(
        supabase
          .from('clients')
          .select('*')
          .eq('store_id', storeId),
      )),
      map(result =>
        getSupabaseList(result).filter(client => client.name || client.email)
      ),
    );
  }

  getClient(id: string): Observable<Client> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .eq('store_id', storeId)
          .single(),
      )),
      map(getSupabaseData),
    );
  }

  createClient(client: ClientInsert): Observable<Client> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('clients')
          .insert({ ...client, store_id: storeId })
          .select()
          .single(),
      )),
      map(getSupabaseData),
    );
  }

  updateClient(id: string, client: ClientUpdate): Observable<Client> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('clients')
          .update(client)
          .eq('id', id)
          .eq('store_id', storeId)
          .select()
          .single(),
      )),
      map(getSupabaseData),
    );
  }

  deleteClient(id: string): Observable<void> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('clients')
          .delete()
          .eq('id', id)
          .eq('store_id', storeId),
      )),
      map(throwSupabaseError),
    );
  }
}
