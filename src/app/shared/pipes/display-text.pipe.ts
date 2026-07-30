import { Pipe, PipeTransform } from '@angular/core';

export function formatDisplayText(value: unknown, fallback = '-'): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

@Pipe({ name: 'displayText' })
export class DisplayTextPipe implements PipeTransform {
  transform(value: unknown, fallback = '-'): string {
    return formatDisplayText(value, fallback);
  }
}
