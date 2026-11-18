import { generarContratoPdf, nombreArchivoContrato } from './contrato-pdf';
import { cliente, renta, vehiculo } from '../testing/datos';
import { EMPRESA_DEMO } from './empresa-demo';

describe('Contrato PDF', () => {
  function texto(): string {
    const doc = generarContratoPdf({
      renta: renta(12, { comentario: 'Entrega con tanque lleno', fechaDevolucion: null }),
      cliente: cliente(1, { nombre: 'Ana Perez' }),
      vehiculo: vehiculo(12, 'Rentado', { descripcion: 'Toyota Corolla', noPlaca: 'A123456' }),
      marca: 'Toyota',
      modelo: 'Corolla',
      generadoEn: new Date(2026, 10, 17),
    });
    return doc.output();
  }

  it('incluye partes, vehículo, importes persistidos y empleado responsable', () => {
    const pdf = texto();
    for (const esperado of ['Contrato de Renta de Veh', '#12', 'Ana Perez', '402-1242850-8', 'Toyota Corolla', 'A123456', 'RD$ 3,000.00', 'RD$ 540.00', 'RD$ 3,540.00', 'Empleado Responsable', 'Pendiente', 'Entrega con tanque lleno']) {
      expect(pdf).toContain(esperado);
    }
  });

  it('identifica la empresa y sus datos de contacto como ficticios', () => {
    const pdf = texto();
    expect(pdf).toContain('ficticio');
    expect(pdf).toContain(EMPRESA_DEMO.correo);
    expect(EMPRESA_DEMO.correo.endsWith('.example')).toBe(true);
  });

  it('nombre de archivo con numeración de tres dígitos', () => {
    expect(nombreArchivoContrato(7)).toBe('Contrato_Renta_007.pdf');
  });
});
