import { Injectable } from '@angular/core';
import { from, Observable, of } from 'rxjs';

export interface ViaCepAddress {
  postalCode: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

interface ViaCepResponse {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ViaCepService {
  lookup(cep: string): Observable<ViaCepAddress | null> {
    const postalCode = this.onlyDigits(cep);

    if (postalCode.length !== 8) {
      return of(null);
    }

    return from(this.fetchAddress(postalCode));
  }

  private async fetchAddress(postalCode: string): Promise<ViaCepAddress | null> {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${postalCode}/json/`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json() as ViaCepResponse;

      if (data.erro) {
        return null;
      }

      return {
        postalCode,
        street: data.logradouro || '',
        district: data.bairro || '',
        city: data.localidade || '',
        state: (data.uf || '').toUpperCase(),
      };
    } catch {
      return null;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }

  private onlyDigits(value: string): string {
    return value.replace(/\D/g, '');
  }
}
