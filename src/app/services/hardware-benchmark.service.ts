import { Injectable } from '@angular/core';
import { from, map, Observable, timeout } from 'rxjs';
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
    return from(this.invokeFunction<HardwareBenchmarkResponse>('hardware-benchmark-chat', { ...request })).pipe(
      timeout({ first: 15000 }),
      map(response => ({
        ...response,
        answer: this.normalizeAnswer(response.answer),
      })),
    );
  }

  private normalizeAnswer(answer: string): string {
    return (answer || '')
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/i, '')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .replace(/\*+/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
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
