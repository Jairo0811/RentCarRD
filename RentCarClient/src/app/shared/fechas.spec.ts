import { fechaLocalISO, formatearFecha, limiteDelDia, marcaDeTiempo, parsearFecha } from './fechas';

describe('Fechas locales', () => {
  it('fechaLocalISO usa el calendario local, no UTC', () => {
    // 21:30 del 17 de noviembre en hora local: toISOString() podría dar el día 18 en UTC−4.
    const noche = new Date(2026, 10, 17, 21, 30);
    expect(fechaLocalISO(noche)).toBe('2026-11-17');
    expect(fechaLocalISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('interpreta "yyyy-MM-dd" como fecha local', () => {
    const fecha = parsearFecha('2026-03-09')!;
    expect([fecha.getFullYear(), fecha.getMonth(), fecha.getDate(), fecha.getHours()]).toEqual([2026, 2, 9, 0]);
  });

  it('interpreta datetime2 sin zona como hora local', () => {
    const fecha = parsearFecha('2026-03-09T00:00:00')!;
    expect(fecha.getDate()).toBe(9);
  });

  it('límites del día para filtros inclusivos', () => {
    expect(limiteDelDia('2026-05-01', false)!.getHours()).toBe(0);
    const fin = limiteDelDia('2026-05-01', true)!;
    expect([fin.getHours(), fin.getMinutes(), fin.getSeconds()]).toEqual([23, 59, 59]);
  });

  it('formatos y valores vacíos', () => {
    expect(formatearFecha(null)).toBe('Pendiente');
    expect(formatearFecha('no-es-fecha', 'N/D')).toBe('N/D');
    expect(formatearFecha('2026-12-25')).toBe(new Date(2026, 11, 25).toLocaleDateString('es-DO'));
    expect(marcaDeTiempo(new Date(2026, 1, 3, 4, 5, 6))).toBe('20260203_040506');
  });
});
