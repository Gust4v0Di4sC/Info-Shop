import { Injectable } from '@angular/core';
import { from, Observable, map, switchMap } from 'rxjs';
import { Client, ClientInsert, ClientUpdate } from '@app/models/client.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData } from '@app/core/supabase/supabase-response';
import { TenantContextService } from '@app/core/tenant/tenant-context.service';

@Injectable({
  providedIn: 'root'
})
export class ClientFormService {
  constructor(private tenantContext: TenantContextService) {}

  /** Upload da imagem no bucket "clients" */
  uploadImage(file: File): Observable<{ imageUrl: string }> {
    const fileName = `${Date.now()}_${file.name}`;

    return from(
      supabase.storage
        .from('clients')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })
    ).pipe(
      map(({ error }) => {
        if (error) throw error;

        const publicUrl = supabase.storage
          .from('clients')
          .getPublicUrl(fileName).data.publicUrl;

        return { imageUrl: publicUrl };
      })
    );
  }

  /** Criar cliente */
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

  /** Buscar por ID */
  getClientById(id: string): Observable<Client> {
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

  /** Atualizar cliente */
  updateClient(id: string, clientData: ClientUpdate): Observable<Client> {
    return from(this.tenantContext.getSelectedStoreId()).pipe(
      switchMap(storeId => from(
        supabase
          .from('clients')
          .update(clientData)
          .eq('id', id)
          .eq('store_id', storeId)
          .select()
          .single(),
      )),
      map(getSupabaseData),
    );
  }
}
