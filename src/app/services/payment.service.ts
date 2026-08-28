import { Injectable } from '@angular/core';
import { from, Observable, timeout } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import { PaymentPreferenceRequest, PaymentPreferenceResult } from '@app/models/payment.model';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  createPreference(request: PaymentPreferenceRequest): Observable<PaymentPreferenceResult> {
    return from(this.invokeFunction<PaymentPreferenceResult>('mercado-pago-create-preference', {
      address: request.address,
      selectedServiceId: request.selectedServiceId,
    })).pipe(timeout({ first: 20000 }));
  }

  private async invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke<T>(name, { body });

    if (error) {
      throw await this.normalizeFunctionError(error);
    }

    if (!data) {
      throw new Error('Resposta vazia do servidor.');
    }

    return data;
  }

  private async normalizeFunctionError(error: unknown): Promise<Error> {
    const context = (error as { context?: Response }).context;

    if (context) {
      try {
        const body = await context.clone().json() as { message?: unknown };
        if (typeof body.message === 'string' && body.message.trim()) {
          return new Error(body.message);
        }
      } catch {
        try {
          const text = await context.clone().text();
          if (text.trim()) {
            return new Error(text.trim());
          }
        } catch {
          // Fall through to the original error below.
        }
      }
    }

    return error instanceof Error ? error : new Error('Falha ao consultar o servidor.');
  }
}
