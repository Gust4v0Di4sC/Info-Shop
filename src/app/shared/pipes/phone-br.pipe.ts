import { Pipe, PipeTransform } from '@angular/core';

function onlyDigits(value: string | number): string {
  return String(value).replace(/\D/g, '');
}

export function formatPhoneBr(value: string | number | null | undefined, fallback = '-'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }

  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return String(value);
}

@Pipe({ name: 'phoneBr' })
export class PhoneBrPipe implements PipeTransform {
  transform(value: string | number | null | undefined, fallback = '-'): string {
    return formatPhoneBr(value, fallback);
  }
}
