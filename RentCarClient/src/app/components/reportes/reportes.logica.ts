import type { Workbook, Worksheet } from 'exceljs';
import { Cliente, EstadoRenta, Renta, Vehiculo } from '../../interfaces/modelos';
import { EMPRESA_DEMO } from '../../shared/empresa-demo';
import { limiteDelDia, parsearFecha } from '../../shared/fechas';
import { Desglose, desgloseRenta, sumarDesgloses } from '../../shared/montos';

/** Lógica pura de reportes (filtros, totales y libro Excel), separada del componente para probarla. */

export interface FiltrosReporte {
  desde: string;
  hasta: string;
  idCliente: number | null;
  idVehiculo: number | null;
  estado: EstadoRenta | '';
}

export const FILTROS_VACIOS: FiltrosReporte = { desde: '', hasta: '', idCliente: null, idVehiculo: null, estado: '' };

export interface ResumenReporte extends Desglose {
  cantidad: number;
  activas: number;
  concluidas: number;
}

/** Filtra por fecha de renta (días locales, ambos extremos incluidos), cliente, vehículo y estado. */
export function filtrarRentas(rentas: Renta[], filtros: FiltrosReporte): Renta[] {
  const desde = filtros.desde ? limiteDelDia(filtros.desde, false) : null;
  const hasta = filtros.hasta ? limiteDelDia(filtros.hasta, true) : null;

  return rentas.filter((renta) => {
    const fecha = parsearFecha(renta.fechaRenta);
    if (!fecha) return false;
    if (desde && fecha < desde) return false;
    if (hasta && fecha > hasta) return false;
    if (filtros.idCliente && renta.idCliente !== Number(filtros.idCliente)) return false;
    if (filtros.idVehiculo && renta.idVehiculo !== Number(filtros.idVehiculo)) return false;
    if (filtros.estado && renta.estado !== filtros.estado) return false;
    return true;
  });
}

/** Totales exactos en centavos (sin acumulación de errores de coma flotante). */
export function resumirRentas(rentas: Renta[]): ResumenReporte {
  return {
    cantidad: rentas.length,
    activas: rentas.filter((r) => r.estado === 'Activa').length,
    concluidas: rentas.filter((r) => r.estado === 'Concluida').length,
    ...sumarDesgloses(rentas.map(desgloseRenta)),
  };
}

/** Rango de fechas inválido (desde posterior a hasta). */
export function rangoInvalido(filtros: FiltrosReporte): boolean {
  return !!filtros.desde && !!filtros.hasta && filtros.desde > filtros.hasta;
}

export function nombreCliente(clientes: Cliente[], id: number): string {
  return clientes.find((c) => c.id === id)?.nombre ?? `Cliente ID ${id}`;
}

export function nombreVehiculo(vehiculos: Vehiculo[], id: number): string {
  const vehiculo = vehiculos.find((v) => v.id === id);
  if (!vehiculo) return `Vehículo ID ${id}`;
  return vehiculo.noPlaca ? `${vehiculo.descripcion} - ${vehiculo.noPlaca}` : vehiculo.descripcion;
}

const FORMATO_RD = '"RD$" #,##0.00';
const FORMATO_FECHA = 'dd/mm/yyyy';

export interface DatosLibro {
  rentas: Renta[];
  clientes: Cliente[];
  vehiculos: Vehiculo[];
  filtros: { desde: string; hasta: string; cliente: string; vehiculo: string; estado: string };
  generadoEn: Date;
}

/**
 * Libro Excel del reporte. Las fechas se guardan como fechas reales y los importes como números
 * con formato RD$ (Excel puede ordenarlos y sumarlos). La hoja "Resumen" solo aplica formato
 * monetario a las filas que son importes.
 */
export function llenarLibroReporte(libro: Workbook, datos: DatosLibro): void {
  libro.creator = 'RentCarRD';
  libro.created = datos.generadoEn;

  const hoja = libro.addWorksheet('Rentas');
  hoja.columns = [
    { header: 'No. Renta', key: 'noRenta', width: 12 },
    { header: 'Fecha de renta', key: 'fechaRenta', width: 16, style: { numFmt: FORMATO_FECHA } },
    { header: 'Devolución prevista', key: 'prevista', width: 20, style: { numFmt: FORMATO_FECHA } },
    { header: 'Devolución real', key: 'real', width: 17, style: { numFmt: FORMATO_FECHA } },
    { header: 'Cliente', key: 'cliente', width: 30 },
    { header: 'Vehículo', key: 'vehiculo', width: 38 },
    { header: 'Empleado', key: 'empleado', width: 26 },
    { header: 'Días', key: 'dias', width: 8 },
    { header: 'Tarifa por día', key: 'tarifa', width: 16, style: { numFmt: FORMATO_RD } },
    { header: 'Subtotal', key: 'subtotal', width: 16, style: { numFmt: FORMATO_RD } },
    { header: 'ITBIS (18%)', key: 'itbis', width: 16, style: { numFmt: FORMATO_RD } },
    { header: 'Total contrato', key: 'total', width: 16, style: { numFmt: FORMATO_RD } },
    { header: 'Estado', key: 'estado', width: 12 },
  ];

  for (const renta of datos.rentas) {
    const d = desgloseRenta(renta);
    hoja.addRow({
      noRenta: renta.noRenta,
      fechaRenta: parsearFecha(renta.fechaRenta),
      prevista: parsearFecha(renta.fechaDevolucionPrevista),
      real: parsearFecha(renta.fechaDevolucion) ?? 'Pendiente',
      cliente: nombreCliente(datos.clientes, renta.idCliente),
      vehiculo: nombreVehiculo(datos.vehiculos, renta.idVehiculo),
      empleado: renta.nombreEmpleado,
      dias: renta.cantidadDias,
      tarifa: Number(renta.montoXDia),
      subtotal: d.subtotal,
      itbis: d.itbis,
      total: d.total,
      estado: renta.estado,
    });
  }
  estilizarEncabezado(hoja);

  const resumen = resumirRentas(datos.rentas);
  const hojaResumen = libro.addWorksheet('Resumen');
  hojaResumen.columns = [
    { header: 'Indicador', key: 'indicador', width: 28 },
    { header: 'Valor', key: 'valor', width: 44 },
  ];
  const filas: [string, string | number | Date, boolean][] = [
    ['Fecha de generación', datos.generadoEn, false],
    ['Fecha desde', datos.filtros.desde || 'Todas', false],
    ['Fecha hasta', datos.filtros.hasta || 'Todas', false],
    ['Cliente', datos.filtros.cliente, false],
    ['Vehículo', datos.filtros.vehiculo, false],
    ['Estado', datos.filtros.estado || 'Todos', false],
    ['Rentas encontradas', resumen.cantidad, false],
    ['Rentas activas', resumen.activas, false],
    ['Rentas concluidas', resumen.concluidas, false],
    ['Subtotal contratado', resumen.subtotal, true],
    ['ITBIS (18%)', resumen.itbis, true],
    ['Total contratado', resumen.total, true],
    ['Nota', 'Importes pactados en los contratos; RentCarRD no registra cobros.', false],
    ['Aviso', EMPRESA_DEMO.aviso, false],
  ];
  for (const [indicador, valor, esMonto] of filas) {
    const fila = hojaResumen.addRow({ indicador, valor });
    if (esMonto) fila.getCell(2).numFmt = FORMATO_RD;
    if (valor instanceof Date) fila.getCell(2).numFmt = 'dd/mm/yyyy hh:mm';
  }
  estilizarEncabezado(hojaResumen, false);
}

function estilizarEncabezado(hoja: Worksheet, conFiltro = true): void {
  const encabezado = hoja.getRow(1);
  encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  encabezado.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
  hoja.views = [{ state: 'frozen', ySplit: 1 }];
  if (conFiltro) {
    hoja.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(1, hoja.rowCount), column: hoja.columnCount } };
  }
}

/** Descarga un Blob y libera la URL temporal después de que el navegador inicia la descarga. */
export function descargarArchivo(blob: Blob, nombre: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.rel = 'noopener';
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  // Revocar inmediatamente puede cancelar la descarga en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
