import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
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
    }));
  }

  private async invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke<T>(name, { body });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Resposta vazia do servidor.');
    }

    return data;
  }
}
