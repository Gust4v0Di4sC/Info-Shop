import { Injectable } from '@angular/core';
import { from, map, Observable, timeout } from 'rxjs';

import { supabase } from '@app/core/supabase/supabase.client';

interface NewsletterSubscribeResponse {
  emailSent: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class NewsletterService {
  subscribe(email: string): Observable<void> {
    const normalizedEmail = email.trim().toLowerCase();

    return from(
      this.invokeFunction('newsletter-subscribe', { email: normalizedEmail }),
    ).pipe(
      timeout({ first: 12000 }),
      map(data => {
        if (!data.emailSent) {
          throw new Error('O e-mail de confirmação não foi enviado.');
        }

        return undefined;
      }),
    );
  }

  private async invokeFunction(
    name: string,
    body: Record<string, unknown>,
  ): Promise<NewsletterSubscribeResponse> {
    const { data, error } = await supabase.functions.invoke<NewsletterSubscribeResponse>(name, { body });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Resposta vazia do servidor.');
    }

    return data;
  }
}
