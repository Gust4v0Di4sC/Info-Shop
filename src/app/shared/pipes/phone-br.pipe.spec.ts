import { formatPhoneBr, PhoneBrPipe } from './phone-br.pipe';

describe('PhoneBrPipe', () => {
  it('formats mobile phone values', () => {
    expect(formatPhoneBr('11987654321')).toBe('(11) 98765-4321');
  });

  it('formats landline phone values', () => {
    expect(formatPhoneBr('1133334444')).toBe('(11) 3333-4444');
  });

  it('returns fallback for empty values', () => {
    const pipe = new PhoneBrPipe();

    expect(pipe.transform(undefined, 'Sem telefone')).toBe('Sem telefone');
  });
});
