import { CpfCnpjPipe, formatCpfCnpj } from './cpf-cnpj.pipe';

describe('CpfCnpjPipe', () => {
  it('formats CPF values', () => {
    expect(formatCpfCnpj('12345678901')).toBe('123.456.789-01');
  });

  it('formats CNPJ values', () => {
    expect(formatCpfCnpj('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('keeps partial values readable', () => {
    const pipe = new CpfCnpjPipe();

    expect(pipe.transform('123')).toBe('123');
    expect(pipe.transform(null, 'Sem documento')).toBe('Sem documento');
  });
});
