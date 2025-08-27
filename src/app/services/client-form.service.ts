import { Injectable } from '@angular/core';
import { from, Observable, map } from 'rxjs';
import { Client } from './../models/client.model';
import { supabase } from '../../supabase.client';

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
  createClient(client: Omit<Client, 'id'>): Observable<Client> {
    return from(
      supabase
        .from('clients')
        .insert(client)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Client;
      })
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
      map(({ data, error }) => {
        if (error) throw error;
        return data as Client;
      })
    );
  }

  /** Atualizar cliente */
  updateClient(id: string, clientData: Partial<Client>): Observable<Client> {
    return from(
      supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return data as Client;
      })
    );
  }
}
