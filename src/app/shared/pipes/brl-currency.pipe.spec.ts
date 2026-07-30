import { BrlCurrencyPipe, formatBrlCurrency } from './brl-currency.pipe';

describe('BrlCurrencyPipe', () => {
  it('formats numbers as BRL currency', () => {
    expect(formatBrlCurrency(1299.9)).toBe('R$ 1.299,90');
  });

  it('returns fallback for invalid values', () => {
    const pipe = new BrlCurrencyPipe();

    expect(pipe.transform(null)).toBe('-');
    expect(pipe.transform('invalid', 'N/A')).toBe('N/A');
  });
});
