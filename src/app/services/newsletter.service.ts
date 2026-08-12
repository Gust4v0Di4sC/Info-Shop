import { Injectable } from '@angular/core';
import { from, Observable, switchMap } from 'rxjs';

import { supabase } from '@app/core/supabase/supabase.client';
import { getSupabaseData } from '@app/core/supabase/supabase-response';

@Injectable({
  providedIn: 'root',
})
export class NewsletterService {
  subscribe(email: string): Observable<void> {
    const normalizedEmail = email.trim().toLowerCase();

    return from(
      supabase.functions.invoke('newsletter-subscribe', {
        body: { email: normalizedEmail },
      }),
    ).pipe(
      switchMap(({ error }) => {
        if (!error) {
          return from(Promise.resolve(undefined));
        }

        return from(
          supabase
            .rpc('subscribe_newsletter', { email_value: normalizedEmail })
            .then(result => {
              getSupabaseData(result);
            }),
        );
      }),
    );
  }
}
