import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { Cliente, Renta, Vehiculo } from '../../interfaces/modelos';
import { ClienteService } from '../../services/cliente.service';
import { RentaService } from '../../services/renta.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { mensajeError, notificar } from '../../shared/alertas';
import { cargarLogoBase64 } from '../../shared/contrato-pdf';
import { EMPRESA_DEMO } from '../../shared/empresa-demo';
import { formatearFecha, marcaDeTiempo } from '../../shared/fechas';
import { desgloseRenta, formatoRD } from '../../shared/montos';
import {
  FILTROS_VACIOS,
  FiltrosReporte,
  ResumenReporte,
  descargarArchivo,
  filtrarRentas,
  llenarLibroReporte,
  nombreCliente,
  nombreVehiculo,
  rangoInvalido,
  resumirRentas,
} from './reportes.logica';

/** Reportes de rentas con exportación PDF y Excel (solo Admin: guard por rol en la ruta). */
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './reportes.html',
})
export class ReportesComponent implements OnInit {
  private readonly rentaService = inject(RentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly empresa = EMPRESA_DEMO;

  todasLasRentas: Renta[] = [];
  clientes: Cliente[] = [];
  vehiculos: Vehiculo[] = [];
  filtros: FiltrosReporte = { ...FILTROS_VACIOS };

  cargando = true;
  errorCarga = '';
  exportando = false;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.errorCarga = '';
    forkJoin({
      rentas: this.rentaService.getRentas(),
      clientes: this.clienteService.getClientes(),
      vehiculos: this.vehiculoService.getVehiculos(),
    }).subscribe({
      next: ({ rentas, clientes, vehiculos }) => {
        this.todasLasRentas = [...rentas];
        this.clientes = [...clientes];
        this.vehiculos = [...vehiculos];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorCarga = mensajeError(error, 'No fue posible cargar la información de reportes.');
        this.cdr.markForCheck();
      },
    });
  }

  get rangoInvalido(): boolean {
    return rangoInvalido(this.filtros);
  }

  get rentasFiltradas(): Renta[] {
    return this.rangoInvalido ? [] : filtrarRentas(this.todasLasRentas, this.filtros);
  }

  get resumen(): ResumenReporte {
    return resumirRentas(this.rentasFiltradas);
  }

  desglose(renta: Renta) {
    return desgloseRenta(renta);
  }

  obtenerCliente(id: number): string {
    return nombreCliente(this.clientes, id);
  }

  obtenerVehiculo(id: number): string {
    return nombreVehiculo(this.vehiculos, id);
  }

  fecha(valor: string | null | undefined, vacio = 'Pendiente'): string {
    return formatearFecha(valor, vacio);
  }

  limpiarFiltros(): void {
    this.filtros = { ...FILTROS_VACIOS };
  }

  private descripcionFiltros() {
    return {
      desde: this.filtros.desde ? formatearFecha(this.filtros.desde) : '',
      hasta: this.filtros.hasta ? formatearFecha(this.filtros.hasta) : '',
      cliente: this.filtros.idCliente ? this.obtenerCliente(Number(this.filtros.idCliente)) : 'Todos',
      vehiculo: this.filtros.idVehiculo ? this.obtenerVehiculo(Number(this.filtros.idVehiculo)) : 'Todos',
      estado: this.filtros.estado,
    };
  }

  private puedeExportar(): boolean {
    if (this.exportando) return false;
    if (this.rangoInvalido) {
      void notificar('La fecha "desde" no puede ser posterior a la fecha "hasta".', 'warning');
      return false;
    }
    if (this.rentasFiltradas.length === 0) {
      void notificar('No existen rentas con los filtros seleccionados.', 'info');
      return false;
    }
    return true;
  }

  async imprimirReporte(): Promise<void> {
    if (!this.puedeExportar()) return;
    this.exportando = true;
    try {
      const rentas = this.rentasFiltradas;
      const resumen = resumirRentas(rentas);
      const filtros = this.descripcionFiltros();
      const ahora = new Date();
      const logoBase64 = await cargarLogoBase64();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }) as jsPDF & { lastAutoTable?: { finalY: number } };

      if (logoBase64) doc.addImage(logoBase64, 'PNG', 14, 10, 25, 25);
      doc.setFontSize(20);
      doc.setTextColor(25, 66, 120);
      doc.text(EMPRESA_DEMO.nombre, 44, 17);
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(EMPRESA_DEMO.subtitulo, 44, 23);
      doc.text(`RNC: ${EMPRESA_DEMO.rnc}`, 44, 29);
      doc.text(EMPRESA_DEMO.direccion, 44, 35);
      doc.text(`Tel.: ${EMPRESA_DEMO.telefono}`, 210, 23);
      doc.text(`Correo: ${EMPRESA_DEMO.correo}`, 210, 29);
      doc.setDrawColor(25, 66, 120);
      doc.setLineWidth(0.8);
      doc.line(14, 42, 282, 42);
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Reporte de Rentas y Consultas', 148, 53, { align: 'center' });

      autoTable(doc, {
        startY: 60,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [25, 66, 120], textColor: 255 },
        head: [['Fecha de generación', 'Fecha desde', 'Fecha hasta', 'Cliente', 'Vehículo', 'Estado']],
        body: [[ahora.toLocaleString('es-DO'), filtros.desde || 'Todas', filtros.hasta || 'Todas', filtros.cliente, filtros.vehiculo, filtros.estado || 'Todos']],
      });

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY ?? 70) + 8,
        theme: 'striped',
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [33, 37, 41], textColor: 255 },
        head: [['No.', 'Fecha renta', 'Dev. prevista', 'Dev. real', 'Cliente', 'Vehículo', 'Días', 'Tarifa', 'Subtotal', 'ITBIS (18%)', 'Total', 'Estado']],
        body: rentas.map((renta) => {
          const d = desgloseRenta(renta);
          return [
            `#${renta.noRenta}`,
            formatearFecha(renta.fechaRenta, 'N/D'),
            formatearFecha(renta.fechaDevolucionPrevista, 'N/D'),
            formatearFecha(renta.fechaDevolucion),
            this.obtenerCliente(renta.idCliente),
            this.obtenerVehiculo(renta.idVehiculo),
            String(renta.cantidadDias),
            formatoRD(renta.montoXDia),
            formatoRD(d.subtotal),
            formatoRD(d.itbis),
            formatoRD(d.total),
            renta.estado,
          ];
        }),
        columnStyles: {
          0: { cellWidth: 12 },
          6: { halign: 'center' },
          7: { halign: 'right' },
          8: { halign: 'right' },
          9: { halign: 'right' },
          10: { halign: 'right' },
          11: { halign: 'center' },
        },
      });

      autoTable(doc, {
        startY: (doc.lastAutoTable?.finalY ?? 100) + 10,
        theme: 'grid',
        styles: { fontSize: 9, halign: 'center' },
        headStyles: { fillColor: [25, 66, 120], textColor: 255 },
        head: [['Rentas encontradas', 'Activas', 'Concluidas', 'Subtotal contratado', 'ITBIS (18%)', 'Total contratado']],
        body: [[resumen.cantidad, resumen.activas, resumen.concluidas, formatoRD(resumen.subtotal), formatoRD(resumen.itbis), formatoRD(resumen.total)]],
      });

      const paginas = doc.getNumberOfPages();
      for (let pagina = 1; pagina <= paginas; pagina++) {
        doc.setPage(pagina);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(EMPRESA_DEMO.aviso, 148, 193, { align: 'center' });
        doc.text(`Generado por Francis Jairo Matías Rosario - RentCarRD | ${ahora.toLocaleString('es-DO')}`, 148, 198, { align: 'center' });
        doc.text(`Página ${pagina} de ${paginas}`, 282, 198, { align: 'right' });
      }

      doc.save(`Reporte_Rentas_${marcaDeTiempo(ahora)}.pdf`);
    } catch {
      void notificar('No se pudo generar el reporte PDF.', 'error');
    } finally {
      this.exportando = false;
      this.cdr.markForCheck();
    }
  }

  async exportarExcel(): Promise<void> {
    if (!this.puedeExportar()) return;
    this.exportando = true;
    try {
      const ahora = new Date();
      const modulo = await import('exceljs/dist/exceljs.min.js');
      const ExcelJS = modulo.default;
      const libro = new ExcelJS.Workbook();
      llenarLibroReporte(libro, {
        rentas: this.rentasFiltradas,
        clientes: this.clientes,
        vehiculos: this.vehiculos,
        filtros: this.descripcionFiltros(),
        generadoEn: ahora,
      });

      const contenido = await libro.xlsx.writeBuffer();
      descargarArchivo(
        new Blob([contenido], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `Reporte_Rentas_${marcaDeTiempo(ahora)}.xlsx`,
      );
    } catch {
      void notificar('No se pudo generar el archivo de Excel.', 'error');
    } finally {
      this.exportando = false;
      this.cdr.markForCheck();
    }
  }
}
