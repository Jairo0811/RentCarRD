import { aCentavos, calcularDesglose, desgloseRenta, formatoRD, sumarDesgloses } from './montos';

describe('Cálculo monetario (idéntico a CalculadoraRenta de la API)', () => {
  it('subtotal = tarifa × días, ITBIS 18 % y total', () => {
    expect(calcularDesglose(2500.5, 2)).toEqual({ subtotal: 5001, itbis: 900.18, total: 5901.18 });
    expect(calcularDesglose(1000, 3)).toEqual({ subtotal: 3000, itbis: 540, total: 3540 });
  });

  it('redondeo comercial sin errores de coma flotante (100.25 × 0.18 = 18.045 → 18.05)', () => {
    // En coma flotante 100.25 * 0.18 = 18.044999…, que con toFixed daría 18.04.
    expect(calcularDesglose(100.25, 1)).toEqual({ subtotal: 100.25, itbis: 18.05, total: 118.3 });
    expect(calcularDesglose(0.1, 3).subtotal).toBe(0.3);
  });

  it('valores vacíos o inválidos producen cero', () => {
    expect(calcularDesglose(null, 3)).toEqual({ subtotal: 0, itbis: 0, total: 0 });
    expect(calcularDesglose(500, -2)).toEqual({ subtotal: 0, itbis: 0, total: 0 });
    expect(aCentavos('abc')).toBe(0);
  });

  it('usa los importes persistidos y solo calcula para registros históricos sin desglose', () => {
    expect(desgloseRenta({ montoXDia: 100, cantidadDias: 1, subtotal: 100, itbis: 18, total: 118 })).toEqual({ subtotal: 100, itbis: 18, total: 118 });
    expect(desgloseRenta({ montoXDia: 100, cantidadDias: 2, subtotal: 0, itbis: 0, total: 0 })).toEqual({ subtotal: 200, itbis: 36, total: 236 });
  });

  it('suma desgloses en centavos', () => {
    const lista = Array.from({ length: 10 }, () => ({ subtotal: 0.1, itbis: 0.02, total: 0.12 }));
    expect(sumarDesgloses(lista)).toEqual({ subtotal: 1, itbis: 0.2, total: 1.2 });
    expect(sumarDesgloses([])).toEqual({ subtotal: 0, itbis: 0, total: 0 });
  });

  it('formatea moneda dominicana', () => {
    expect(formatoRD(1234.5)).toMatch(/^RD\$ 1,234\.50$/);
    expect(formatoRD(null)).toBe('RD$ 0.00');
  });
});
