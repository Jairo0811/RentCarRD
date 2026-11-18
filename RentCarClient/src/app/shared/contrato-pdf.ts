import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Cliente, Renta, Vehiculo } from '../interfaces/modelos';
import { formatearDocumento } from './documentos';
import { EMPRESA_DEMO } from './empresa-demo';
import { formatearFecha } from './fechas';
import { desgloseRenta, formatoRD } from './montos';

export interface DatosContrato {
  renta: Renta;
  cliente?: Cliente | null;
  vehiculo?: Vehiculo | null;
  marca: string;
  modelo: string;
  logoBase64?: string | null;
  generadoEn?: Date;
}

type DocConTabla = jsPDF & { lastAutoTable?: { finalY: number } };

function finTabla(doc: DocConTabla, respaldo: number): number {
  return doc.lastAutoTable?.finalY ?? respaldo;
}

/**
 * Contrato de renta en PDF. Función pura respecto de la aplicación (recibe todos los datos),
 * lo que permite probar su contenido. Usa los importes persistidos por el servidor y deja
 * constancia de que la empresa y sus datos de contacto son ficticios.
 */
export function generarContratoPdf(datos: DatosContrato): jsPDF {
  const { renta, cliente, vehiculo, marca, modelo, logoBase64 } = datos;
  const { subtotal, itbis, total } = desgloseRenta(renta);
  const doc: DocConTabla = new jsPDF();

  if (logoBase64) {
    doc.addImage(logoBase64, 'PNG', 14, 10, 28, 28);
  }

  doc.setFontSize(20);
  doc.setTextColor(25, 66, 120);
  doc.text(EMPRESA_DEMO.nombre, 48, 18);

  doc.setFontSize(10);
  doc.setTextColor(90, 90, 90);
  doc.text(EMPRESA_DEMO.subtitulo, 48, 24);
  doc.text(`RNC: ${EMPRESA_DEMO.rnc}`, 48, 30);
  doc.text(EMPRESA_DEMO.direccion, 48, 36);

  doc.setFontSize(9);
  doc.text(`Tel.: ${EMPRESA_DEMO.telefono}`, 145, 24);
  doc.text(`Correo: ${EMPRESA_DEMO.correo}`, 145, 30);

  doc.setDrawColor(25, 66, 120);
  doc.setLineWidth(0.8);
  doc.line(14, 44, 196, 44);

  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Contrato de Renta de Vehículo', 105, 55, { align: 'center' });

  autoTable(doc, {
    startY: 62,
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [25, 66, 120], textColor: 255 },
    head: [['No. Renta', 'Fecha de renta', 'Devolución prevista', 'Devolución real', 'Estado', 'Empleado']],
    body: [[
      `#${renta.noRenta}`,
      formatearFecha(renta.fechaRenta, 'N/D'),
      formatearFecha(renta.fechaDevolucionPrevista, 'N/D'),
      formatearFecha(renta.fechaDevolucion, 'Pendiente'),
      renta.estado,
      renta.nombreEmpleado,
    ]],
  });

  const tipoPersona = cliente?.tipoPersona === 'Juridica' ? 'Jurídica' : 'Física';
  const nombreDocumento = cliente?.tipoPersona === 'Juridica' ? 'RNC' : 'Cédula';

  autoTable(doc, {
    startY: finTabla(doc, 80) + 8,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [33, 37, 41], textColor: 255 },
    head: [['Datos del cliente', 'Datos del vehículo']],
    body: [[
      `Nombre: ${cliente?.nombre ?? 'N/A'}\n` +
        `${nombreDocumento}: ${cliente ? formatearDocumento(cliente.cedula, cliente.tipoPersona) : 'N/A'}\n` +
        `Tipo de persona: ${tipoPersona}\n` +
        `Límite de crédito: ${formatoRD(cliente?.limiteCredito ?? 0)}`,
      `Vehículo: ${vehiculo?.descripcion ?? 'N/A'}\n` +
        `Marca: ${marca}\n` +
        `Modelo: ${modelo}\n` +
        `Placa: ${vehiculo?.noPlaca ?? 'N/A'}`,
    ]],
  });

  autoTable(doc, {
    startY: finTabla(doc, 110) + 10,
    theme: 'striped',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [25, 66, 120], textColor: 255 },
    head: [['Concepto', 'Cantidad', 'Tarifa por día', 'Subtotal']],
    body: [['Renta de vehículo', `${renta.cantidadDias} días`, formatoRD(renta.montoXDia), formatoRD(subtotal)]],
  });

  autoTable(doc, {
    startY: finTabla(doc, 130) + 10,
    margin: { left: 110 },
    tableWidth: 86,
    theme: 'grid',
    styles: { fontSize: 10, halign: 'right' },
    body: [
      ['Subtotal', formatoRD(subtotal)],
      ['ITBIS (18%)', formatoRD(itbis)],
      ['TOTAL DEL CONTRATO', formatoRD(total)],
    ],
    columnStyles: { 0: { fontStyle: 'bold', halign: 'left' }, 1: { halign: 'right' } },
    didParseCell: (celda) => {
      if (celda.row.index === 2) {
        celda.cell.styles.fillColor = [39, 174, 96];
        celda.cell.styles.textColor = [255, 255, 255];
        celda.cell.styles.fontStyle = 'bold';
      }
    },
  });

  let y = finTabla(doc, 160);

  if (renta.comentario) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Comentario:', 14, y + 12);
    const lineas = doc.splitTextToSize(String(renta.comentario), 180) as string[];
    doc.text(lineas.slice(0, 6), 14, y + 18);
    y += Math.min(lineas.length, 6) * 4;
  }

  const yFirmas = Math.max(y + 42, 220);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text('______________________________', 20, yFirmas);
  doc.text('Firma del cliente', 42, yFirmas + 6);
  doc.text(cliente?.nombre ?? 'Cliente', 42, yFirmas + 12);
  doc.text('______________________________', 120, yFirmas);
  doc.text('Firma del representante', 138, yFirmas + 6);
  doc.text(renta.nombreEmpleado, 137, yFirmas + 12);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(EMPRESA_DEMO.aviso, 105, 279, { align: 'center' });
  doc.text(
    `Generado por Francis Jairo Matías Rosario - RentCarRD | ${(datos.generadoEn ?? new Date()).toLocaleString('es-DO')}`,
    105,
    285,
    { align: 'center' },
  );

  return doc;
}

export function nombreArchivoContrato(noRenta: number): string {
  return `Contrato_Renta_${String(noRenta).padStart(3, '0')}.pdf`;
}

/** Logo como data URL para incrustarlo en los PDF; null si no se puede cargar. */
export async function cargarLogoBase64(ruta = 'images/logo-rentcarrd.png'): Promise<string | null> {
  try {
    const respuesta = await fetch(ruta);
    if (!respuesta.ok) return null;
    const blob = await respuesta.blob();
    return await new Promise<string | null>((resolve) => {
      const lector = new FileReader();
      lector.onloadend = () => resolve(typeof lector.result === 'string' ? lector.result : null);
      lector.onerror = () => resolve(null);
      lector.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
