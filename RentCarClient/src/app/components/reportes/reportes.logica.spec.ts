import ExcelJS from 'exceljs';
import { FILTROS_VACIOS, filtrarRentas, llenarLibroReporte, rangoInvalido, resumirRentas } from './reportes.logica';
import { cliente, renta, vehiculo } from '../../testing/datos';

const rentas = [
  renta(1, { fechaRenta: '2026-11-01T00:00:00', idCliente: 1, idVehiculo: 1, estado: 'Activa' }),
  renta(2, { fechaRenta: '2026-11-15T00:00:00', idCliente: 2, idVehiculo: 2, estado: 'Concluida', fechaDevolucion: '2026-11-18T00:00:00' }),
  renta(3, { fechaRenta: '2026-11-30T00:00:00', idCliente: 1, idVehiculo: 3, estado: 'Concluida', montoXDia: 100.25, cantidadDias: 1, subtotal: 100.25, itbis: 18.05, total: 118.3 }),
];

describe('Reportes: filtros', () => {
  it('sin filtros devuelve todo', () => {
    expect(filtrarRentas(rentas, FILTROS_VACIOS).length).toBe(3);
  });

  it('el rango de fechas incluye ambos extremos (días locales)', () => {
    expect(filtrarRentas(rentas, { ...FILTROS_VACIOS, desde: '2026-11-15', hasta: '2026-11-30' }).map((r) => r.noRenta)).toEqual([2, 3]);
    expect(filtrarRentas(rentas, { ...FILTROS_VACIOS, desde: '2026-11-02', hasta: '2026-11-14' })).toEqual([]);
  });

  it('filtra por cliente, vehículo y estado combinados', () => {
    expect(filtrarRentas(rentas, { ...FILTROS_VACIOS, idCliente: 1 }).map((r) => r.noRenta)).toEqual([1, 3]);
    expect(filtrarRentas(rentas, { ...FILTROS_VACIOS, idCliente: 1, estado: 'Concluida' }).map((r) => r.noRenta)).toEqual([3]);
    expect(filtrarRentas(rentas, { ...FILTROS_VACIOS, idVehiculo: 2 }).map((r) => r.noRenta)).toEqual([2]);
  });

  it('detecta un rango invertido', () => {
    expect(rangoInvalido({ ...FILTROS_VACIOS, desde: '2026-12-01', hasta: '2026-11-01' })).toBe(true);
    expect(rangoInvalido({ ...FILTROS_VACIOS, desde: '2026-11-01' })).toBe(false);
  });

  it('totales exactos con ITBIS persistido', () => {
    expect(resumirRentas(rentas)).toEqual({ cantidad: 3, activas: 1, concluidas: 2, subtotal: 6100.25, itbis: 1098.05, total: 7198.3 });
    expect(resumirRentas([])).toEqual({ cantidad: 0, activas: 0, concluidas: 0, subtotal: 0, itbis: 0, total: 0 });
  });
});

describe('Reportes: Excel (ExcelJS)', () => {
  async function libro() {
    const wb = new ExcelJS.Workbook();
    llenarLibroReporte(wb, {
      rentas,
      clientes: [cliente(1), cliente(2)],
      vehiculos: [vehiculo(1), vehiculo(2), vehiculo(3)],
      filtros: { desde: '', hasta: '', cliente: 'Todos', vehiculo: 'Todos', estado: '' },
      generadoEn: new Date(2026, 10, 17, 10, 30),
    });
    // Ida y vuelta por el formato real .xlsx para verificar lo que recibe el usuario.
    const buffer = await wb.xlsx.writeBuffer();
    const leido = new ExcelJS.Workbook();
    await leido.xlsx.load(buffer as ArrayBuffer);
    return leido;
  }

  it('exporta una fila por renta con importes numéricos en RD$ y fechas reales', async () => {
    const hoja = (await libro()).getWorksheet('Rentas')!;
    expect(hoja.rowCount).toBe(4);
    expect(hoja.getRow(1).getCell(12).value).toBe('Total contrato');

    const fila = hoja.getRow(4);
    expect(fila.getCell(1).value).toBe(3);
    expect(fila.getCell(10).value).toBe(100.25);
    expect(fila.getCell(11).value).toBe(18.05);
    expect(fila.getCell(12).value).toBe(118.3);
    expect(fila.getCell(12).numFmt).toBe('"RD$" #,##0.00');
    expect(fila.getCell(2).value).toBeInstanceOf(Date);
    expect(hoja.getRow(2).getCell(4).value).toBe('Pendiente');
    expect(fila.getCell(7).value).toBe('Empleado Responsable');
  });

  it('el resumen solo aplica formato monetario a los importes y advierte que la empresa es ficticia', async () => {
    const hoja = (await libro()).getWorksheet('Resumen')!;
    const filas = new Map<string, ExcelJS.Row>();
    hoja.eachRow((fila) => filas.set(String(fila.getCell(1).value), fila));

    expect(filas.get('Rentas encontradas')!.getCell(2).value).toBe(3);
    expect(filas.get('Rentas encontradas')!.getCell(2).numFmt ?? '').not.toContain('RD$');
    expect(filas.get('Total contratado')!.getCell(2).value).toBe(7198.3);
    expect(filas.get('Total contratado')!.getCell(2).numFmt).toContain('RD$');
    expect(String(filas.get('Aviso')!.getCell(2).value)).toContain('ficticios');
  });
});
