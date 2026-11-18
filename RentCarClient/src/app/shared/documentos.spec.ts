import { cedulaValida, documentoValido, formatearDocumento, rncValido, soloDigitos } from './documentos';

function cedulaCon(base10: string): string {
  const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    let v = Number(base10[i]) * pesos[i];
    if (v >= 10) v = Math.floor(v / 10) + (v % 10);
    suma += v;
  }
  return base10 + ((10 - (suma % 10)) % 10);
}

describe('Documentos dominicanos', () => {
  it('valida cédulas con dígito verificador', () => {
    const valida = cedulaCon('4021242850');
    expect(cedulaValida(valida)).toBe(true);
    expect(cedulaValida(`${valida.slice(0, 3)}-${valida.slice(3, 10)}-${valida[10]}`)).toBe(true);
    expect(cedulaValida(valida.slice(0, 10) + ((Number(valida[10]) + 1) % 10))).toBe(false);
    expect(cedulaValida('11111111111')).toBe(false);
    expect(cedulaValida('123')).toBe(false);
  });

  it('valida RNC con módulo 11', () => {
    expect(rncValido('131987656')).toBe(true);
    expect(rncValido('131987654')).toBe(false);
    expect(rncValido('999999999')).toBe(false);
  });

  it('elige el validador según el tipo de persona', () => {
    expect(documentoValido('131987656', 'Juridica')).toBe(true);
    expect(documentoValido('131987656', 'Fisica')).toBe(false);
  });

  it('formatea progresivamente y limpia caracteres no numéricos', () => {
    expect(formatearDocumento('40212428508', 'Fisica')).toBe('402-1242850-8');
    expect(formatearDocumento('131987654', 'Juridica')).toBe('131-98765-4');
    expect(formatearDocumento('4021', 'Fisica')).toBe('402-1');
    expect(soloDigitos('a1-2 3', 2)).toBe('12');
  });
});
