import { Pipe, PipeTransform } from '@angular/core';

export function formatBrlCurrency(value: number | string | null | undefined, fallback = '-'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const amount = typeof value === 'number'
    ? value
    : Number(String(value).replace(',', '.'));

  if (!Number.isFinite(amount)) {
    return fallback;
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

@Pipe({ name: 'brlCurrency' })
export class BrlCurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, fallback = '-'): string {
    return formatBrlCurrency(value, fallback);
  }
}
