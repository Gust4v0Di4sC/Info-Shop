import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { supabase } from '@app/core/supabase/supabase.client';
import {
  HardwareBenchmarkRequest,
  HardwareBenchmarkResponse,
} from '@app/models/hardware-benchmark.model';

@Injectable({
  providedIn: 'root',
})
export class HardwareBenchmarkService {
  compare(request: HardwareBenchmarkRequest): Observable<HardwareBenchmarkResponse> {
    return from(this.invokeFunction<HardwareBenchmarkResponse>('hardware-benchmark-chat', { ...request }));
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
