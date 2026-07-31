import { DisplayTextPipe, formatDisplayText } from './display-text.pipe';

describe('DisplayTextPipe', () => {
  it('returns trimmed text when present', () => {
    expect(formatDisplayText('  Info Shop  ')).toBe('Info Shop');
  });

  it('returns fallback for empty values', () => {
    const pipe = new DisplayTextPipe();

    expect(pipe.transform('')).toBe('-');
    expect(pipe.transform(null, 'Não informado')).toBe('Não informado');
  });
});
