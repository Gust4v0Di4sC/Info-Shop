import { Pipe, PipeTransform } from '@angular/core';

function onlyDigits(value: string | number): string {
  return String(value).replace(/\D/g, '');
}

export function formatCpfCnpj(value: string | number | null | undefined, fallback = '-'): string {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const digits = onlyDigits(value);

  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  return String(value);
}

@Pipe({ name: 'cpfCnpj' })
export class CpfCnpjPipe implements PipeTransform {
  transform(value: string | number | null | undefined, fallback = '-'): string {
    return formatCpfCnpj(value, fallback);
  }
}
