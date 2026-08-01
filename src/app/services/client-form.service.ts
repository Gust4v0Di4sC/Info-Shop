import { Injectable } from '@angular/core';
import { from, Observable, map } from 'rxjs';
import { Client, ClientInsert, ClientUpdate } from '@app/models/client.model';
import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData } from '@app/core/supabase/supabase-response';

@Injectable({
  providedIn: 'root'
})
export class ClientFormService {

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

  /** Buscar por ID */
  getClientById(id: string): Observable<Client> {
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

  /** Atualizar cliente */
  updateClient(id: string, clientData: ClientUpdate): Observable<Client> {
    return from(
      supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(getSupabaseData)
    );
  }
}
