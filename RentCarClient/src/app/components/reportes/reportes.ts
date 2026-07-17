import { ChangeDetectorRef, Component, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { RentaService } from '../../services/renta.service';
import { ClienteService } from '../../services/cliente.service';
import { VehiculoService } from '../../services/vehiculo.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
})
export class ReportesComponent implements OnInit {
  private readonly tasaItbis = 0.18;

  todasLasRentas: any[] = [];
  clientes: any[] = [];
  vehiculos: any[] = [];

  filtroFechaDesde = '';
  filtroFechaHasta = '';
  filtroCliente = '';
  filtroVehiculo = '';
  filtroEstado = '';

  empresa = {
    nombre: 'RentCarRD',
    subtitulo: 'Alquiler de Vehículos',
    rnc: '1-31-98765-4',
    direccion: 'Av. Winston Churchill #45, Santo Domingo, República Dominicana',
    telefono: '(809) 555-2026',
    correo: 'info@rentcarrd.com',
  };

  constructor(
    private rentaService: RentaService,
    private clienteService: ClienteService,
    private vehiculoService: VehiculoService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  get rolActual(): string | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem('rolUsuario');
  }

  ngOnInit(): void {
    if (this.rolActual !== 'admin') {
      this.router.navigate(['/login']);
      return;
    }

    setTimeout(() => this.cargarDatos(), 0);
  }

  cargarDatos(): void {
    forkJoin({
      rentas: this.rentaService.getRentas(),
      clientes: this.clienteService.getClientes(),
      vehiculos: this.vehiculoService.getVehiculos(),
    }).subscribe({
      next: ({ rentas, clientes, vehiculos }: any) => {
        this.todasLasRentas = [...rentas];
        this.clientes = [...clientes];
        this.vehiculos = [...vehiculos];

        this.cdr.detectChanges();
      },
      error: (error: any) => {
        console.error('Error al cargar los datos del reporte.', error);

        alert('No fue posible cargar la información de reportes.');
      },
    });
  }

  get rentasFiltradas(): any[] {
    return this.todasLasRentas.filter((renta: any) => {
      const fechaRenta = this.convertirFecha(renta.fechaRenta);

      if (!fechaRenta) {
        return false;
      }

      const fechaDesde = this.filtroFechaDesde
        ? this.crearFechaLocal(this.filtroFechaDesde, false)
        : null;

      const fechaHasta = this.filtroFechaHasta
        ? this.crearFechaLocal(this.filtroFechaHasta, true)
        : null;

      const cumpleFechaDesde = fechaDesde ? fechaRenta >= fechaDesde : true;

      const cumpleFechaHasta = fechaHasta ? fechaRenta <= fechaHasta : true;

      const cumpleCliente = this.filtroCliente
        ? Number(renta.idCliente) === Number(this.filtroCliente)
        : true;

      const cumpleVehiculo = this.filtroVehiculo
        ? Number(renta.idVehiculo) === Number(this.filtroVehiculo)
        : true;

      const cumpleEstado = this.filtroEstado
        ? this.normalizarTexto(renta.estado) === this.normalizarTexto(this.filtroEstado)
        : true;

      return (
        cumpleFechaDesde && cumpleFechaHasta && cumpleCliente && cumpleVehiculo && cumpleEstado
      );
    });
  }

  get cantidadRentasActivas(): number {
    return this.rentasFiltradas.filter((renta: any) => this.esRentaActiva(renta)).length;
  }

  get cantidadRentasConcluidas(): number {
    return this.rentasFiltradas.filter((renta: any) => this.esRentaConcluida(renta)).length;
  }

  get totalSubtotalGenerado(): number {
    return this.rentasFiltradas.reduce(
      (acumulado: number, renta: any) => acumulado + this.obtenerSubtotal(renta),
      0,
    );
  }

  get totalItbisGenerado(): number {
    return this.rentasFiltradas.reduce(
      (acumulado: number, renta: any) => acumulado + this.obtenerItbis(renta),
      0,
    );
  }

  get totalMontoGenerado(): number {
    return this.rentasFiltradas.reduce(
      (acumulado: number, renta: any) => acumulado + this.obtenerTotal(renta),
      0,
    );
  }

  obtenerMontoDia(renta: any): number {
    return Number(renta?.montoXDia ?? renta?.montoXdia ?? 0);
  }

  obtenerSubtotal(renta: any): number {
    const subtotalGuardado = Number(renta?.subtotal ?? 0);

    if (subtotalGuardado > 0) {
      return subtotalGuardado;
    }

    return this.obtenerMontoDia(renta) * Number(renta?.cantidadDias ?? 0);
  }

  obtenerItbis(renta: any): number {
    const itbisGuardado = Number(renta?.itbis ?? 0);

    if (itbisGuardado > 0) {
      return itbisGuardado;
    }

    return this.redondearMonto(this.obtenerSubtotal(renta) * this.tasaItbis);
  }

  obtenerTotal(renta: any): number {
    const totalGuardado = Number(renta?.total ?? 0);

    /*
     * Para rentas nuevas se utiliza el total persistido.
     * Para registros antiguos, donde total puede contener
     * únicamente monto por día × cantidad de días, se
     * reconstruye el valor cuando no existen subtotal e ITBIS.
     */
    const tieneDesglosePersistido =
      Number(renta?.subtotal ?? 0) > 0 || Number(renta?.itbis ?? 0) > 0;

    if (totalGuardado > 0 && tieneDesglosePersistido) {
      return totalGuardado;
    }

    return this.redondearMonto(this.obtenerSubtotal(renta) + this.obtenerItbis(renta));
  }

  obtenerCliente(idCliente: number): string {
    const cliente = this.clientes.find((item: any) => Number(item.id) === Number(idCliente));

    return cliente ? cliente.nombre : `Cliente ID ${idCliente}`;
  }

  obtenerVehiculo(idVehiculo: number): string {
    const vehiculo = this.vehiculos.find((item: any) => Number(item.id) === Number(idVehiculo));

    if (!vehiculo) {
      return `Vehículo ID ${idVehiculo}`;
    }

    const placa = vehiculo.noPlaca ?? vehiculo.placa ?? '';

    return placa ? `${vehiculo.descripcion} - ${placa}` : vehiculo.descripcion;
  }

  formatearFecha(fecha: string | Date | null | undefined): string {
    if (!fecha) {
      return 'Pendiente';
    }

    const valor = this.convertirFecha(fecha);

    if (!valor) {
      return 'Pendiente';
    }

    return valor.toLocaleDateString('es-DO');
  }

  formatoRD(valor: number): string {
    return `RD$ ${Number(valor || 0).toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  limpiarFiltros(): void {
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroCliente = '';
    this.filtroVehiculo = '';
    this.filtroEstado = '';

    this.cdr.detectChanges();
  }

  cargarLogoBase64(): Promise<string | null> {
    return fetch('images/logo-rentcarrd.png')
      .then((response) => {
        if (!response.ok) {
          throw new Error('No fue posible cargar el logo.');
        }

        return response.blob();
      })
      .then(
        (blob) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();

            reader.onloadend = () => resolve(reader.result as string);

            reader.onerror = () => reject(new Error('No fue posible convertir el logo.'));

            reader.readAsDataURL(blob);
          }),
      )
      .catch((error) => {
        console.warn('El reporte se generará sin logo.', error);

        return null;
      });
  }

  async imprimirReporte(): Promise<void> {
    if (this.rentasFiltradas.length === 0) {
      alert('No existen rentas para generar el reporte.');
      return;
    }

    const logoBase64 = await this.cargarLogoBase64();

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', 14, 10, 25, 25);
    }

    doc.setFontSize(20);
    doc.setTextColor(25, 66, 120);
    doc.text(this.empresa.nombre, 44, 17);

    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(this.empresa.subtitulo, 44, 23);
    doc.text(`RNC: ${this.empresa.rnc}`, 44, 29);
    doc.text(this.empresa.direccion, 44, 35);

    doc.text(`Tel.: ${this.empresa.telefono}`, 220, 23);

    doc.text(`Correo: ${this.empresa.correo}`, 220, 29);

    doc.setDrawColor(25, 66, 120);
    doc.setLineWidth(0.8);
    doc.line(14, 42, 282, 42);

    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);

    doc.text('Reporte de Rentas y Consultas', 148, 53, { align: 'center' });

    autoTable(doc, {
      startY: 60,
      theme: 'grid',
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [25, 66, 120],
        textColor: 255,
      },
      head: [
        ['Fecha de Generación', 'Fecha Desde', 'Fecha Hasta', 'Cliente', 'Vehículo', 'Estado'],
      ],
      body: [
        [
          new Date().toLocaleString('es-DO'),
          this.filtroFechaDesde || 'Todas',
          this.filtroFechaHasta || 'Todas',
          this.obtenerDescripcionFiltroCliente(),
          this.obtenerDescripcionFiltroVehiculo(),
          this.filtroEstado || 'Todos',
        ],
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      theme: 'striped',
      styles: {
        fontSize: 7,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [33, 37, 41],
        textColor: 255,
      },
      head: [
        [
          'No.',
          'Fecha Renta',
          'Fecha Devolución',
          'Cliente',
          'Vehículo',
          'Días',
          'Tarifa',
          'Subtotal',
          'ITBIS (18%)',
          'Total',
          'Estado',
        ],
      ],
      body: this.rentasFiltradas.map((renta: any) => [
        `#${renta.noRenta ?? renta.id}`,
        this.formatearFecha(renta.fechaRenta),
        this.formatearFecha(renta.fechaDevolucion),
        this.obtenerCliente(renta.idCliente),
        this.obtenerVehiculo(renta.idVehiculo),
        String(renta.cantidadDias ?? 0),
        this.formatoRD(this.obtenerMontoDia(renta)),
        this.formatoRD(this.obtenerSubtotal(renta)),
        this.formatoRD(this.obtenerItbis(renta)),
        this.formatoRD(this.obtenerTotal(renta)),
        renta.estado ?? 'N/A',
      ]),
      columnStyles: {
        0: {
          cellWidth: 13,
        },
        1: {
          cellWidth: 19,
        },
        2: {
          cellWidth: 22,
        },
        3: {
          cellWidth: 31,
        },
        4: {
          cellWidth: 38,
        },
        5: {
          cellWidth: 10,
          halign: 'center',
        },
        6: {
          cellWidth: 24,
          halign: 'right',
        },
        7: {
          cellWidth: 24,
          halign: 'right',
        },
        8: {
          cellWidth: 22,
          halign: 'right',
        },
        9: {
          cellWidth: 24,
          halign: 'right',
        },
        10: {
          cellWidth: 18,
          halign: 'center',
        },
      },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: 'grid',
      styles: {
        fontSize: 9,
        halign: 'center',
      },
      headStyles: {
        fillColor: [25, 66, 120],
        textColor: 255,
      },
      head: [
        [
          'Rentas Encontradas',
          'Rentas Activas',
          'Rentas Concluidas',
          'Subtotal',
          'ITBIS',
          'Total Generado',
        ],
      ],
      body: [
        [
          this.rentasFiltradas.length,
          this.cantidadRentasActivas,
          this.cantidadRentasConcluidas,
          this.formatoRD(this.totalSubtotalGenerado),
          this.formatoRD(this.totalItbisGenerado),
          this.formatoRD(this.totalMontoGenerado),
        ],
      ],
    });

    const paginaActual = doc.getNumberOfPages();

    for (let pagina = 1; pagina <= paginaActual; pagina++) {
      doc.setPage(pagina);

      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);

      doc.text(
        `Generado por Francis Jairo Matías Rosario - RentCarRD | ${new Date().toLocaleString('es-DO')}`,
        148,
        198,
        { align: 'center' },
      );

      doc.text(`Página ${pagina} de ${paginaActual}`, 282, 198, { align: 'right' });
    }

    doc.save(`Reporte_Rentas_${this.generarMarcaTiempo()}.pdf`);
  }

  exportarExcel(): void {
    if (this.rentasFiltradas.length === 0) {
      alert('No existen rentas para exportar a Excel.');
      return;
    }

    const datosRentas = this.rentasFiltradas.map((renta: any) => ({
      'No. Renta': renta.noRenta ?? renta.id,
      'Fecha de Renta': this.formatearFecha(renta.fechaRenta),
      'Fecha de Devolución': this.formatearFecha(renta.fechaDevolucion),
      Cliente: this.obtenerCliente(renta.idCliente),
      Vehículo: this.obtenerVehiculo(renta.idVehiculo),
      'Cantidad de Días': Number(renta.cantidadDias ?? 0),
      'Tarifa por Día': this.obtenerMontoDia(renta),
      Subtotal: this.obtenerSubtotal(renta),
      'ITBIS (18%)': this.obtenerItbis(renta),
      'Total a Pagar': this.obtenerTotal(renta),
      Estado: renta.estado ?? 'N/A',
    }));

    const datosResumen = [
      {
        Indicador: 'Fecha de generación',
        Valor: new Date().toLocaleString('es-DO'),
      },
      {
        Indicador: 'Fecha desde',
        Valor: this.filtroFechaDesde || 'Todas',
      },
      {
        Indicador: 'Fecha hasta',
        Valor: this.filtroFechaHasta || 'Todas',
      },
      {
        Indicador: 'Cliente',
        Valor: this.obtenerDescripcionFiltroCliente(),
      },
      {
        Indicador: 'Vehículo',
        Valor: this.obtenerDescripcionFiltroVehiculo(),
      },
      {
        Indicador: 'Estado',
        Valor: this.filtroEstado || 'Todos',
      },
      {
        Indicador: 'Rentas encontradas',
        Valor: this.rentasFiltradas.length,
      },
      {
        Indicador: 'Rentas activas',
        Valor: this.cantidadRentasActivas,
      },
      {
        Indicador: 'Rentas concluidas',
        Valor: this.cantidadRentasConcluidas,
      },
      {
        Indicador: 'Subtotal general',
        Valor: this.totalSubtotalGenerado,
      },
      {
        Indicador: 'ITBIS general',
        Valor: this.totalItbisGenerado,
      },
      {
        Indicador: 'Total general',
        Valor: this.totalMontoGenerado,
      },
    ];

    const hojaRentas = XLSX.utils.json_to_sheet(datosRentas);

    const hojaResumen = XLSX.utils.json_to_sheet(datosResumen);

    hojaRentas['!cols'] = [
      { wch: 12 },
      { wch: 17 },
      { wch: 21 },
      { wch: 30 },
      { wch: 38 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
    ];

    hojaResumen['!cols'] = [{ wch: 24 }, { wch: 40 }];

    this.aplicarFormatoMonetarioExcel(hojaRentas, datosRentas.length, ['G', 'H', 'I', 'J']);

    this.aplicarFormatoMonetarioExcel(hojaResumen, datosResumen.length, ['B'], 10);

    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hojaRentas, 'Rentas');

    XLSX.utils.book_append_sheet(libro, hojaResumen, 'Resumen');

    XLSX.writeFile(libro, `Reporte_Rentas_${this.generarMarcaTiempo()}.xlsx`);
  }

  private obtenerDescripcionFiltroCliente(): string {
    if (!this.filtroCliente) {
      return 'Todos';
    }

    return this.obtenerCliente(Number(this.filtroCliente));
  }

  private obtenerDescripcionFiltroVehiculo(): string {
    if (!this.filtroVehiculo) {
      return 'Todos';
    }

    return this.obtenerVehiculo(Number(this.filtroVehiculo));
  }

  private esRentaActiva(renta: any): boolean {
    const estado = this.normalizarTexto(renta?.estado);

    return estado === 'activa' || estado === 'abierta';
  }

  private esRentaConcluida(renta: any): boolean {
    return this.normalizarTexto(renta?.estado) === 'concluida';
  }

  private normalizarTexto(valor: unknown): string {
    return String(valor ?? '')
      .trim()
      .toLowerCase();
  }

  private redondearMonto(valor: number): number {
    return Number(Number(valor || 0).toFixed(2));
  }

  private convertirFecha(valor: string | Date | null | undefined): Date | null {
    if (!valor) {
      return null;
    }

    if (valor instanceof Date) {
      return Number.isNaN(valor.getTime()) ? null : valor;
    }

    const fecha = new Date(valor);

    return Number.isNaN(fecha.getTime()) ? null : fecha;
  }

  private crearFechaLocal(fechaIso: string, finDelDia: boolean): Date {
    const [anio, mes, dia] = fechaIso.split('-').map(Number);

    return finDelDia
      ? new Date(anio, mes - 1, dia, 23, 59, 59, 999)
      : new Date(anio, mes - 1, dia, 0, 0, 0, 0);
  }

  private generarMarcaTiempo(): string {
    const ahora = new Date();

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');

    const dia = String(ahora.getDate()).padStart(2, '0');

    const hora = String(ahora.getHours()).padStart(2, '0');

    const minuto = String(ahora.getMinutes()).padStart(2, '0');

    const segundo = String(ahora.getSeconds()).padStart(2, '0');

    return `${anio}${mes}${dia}_${hora}${minuto}${segundo}`;
  }

  private aplicarFormatoMonetarioExcel(
    hoja: XLSX.WorkSheet,
    cantidadFilas: number,
    columnas: string[],
    filaInicial = 2,
  ): void {
    const formato = '"RD$" #,##0.00';

    for (let fila = filaInicial; fila < filaInicial + cantidadFilas; fila++) {
      for (const columna of columnas) {
        const celda = hoja[`${columna}${fila}`];

        if (celda && typeof celda.v === 'number') {
          celda.z = formato;
        }
      }
    }
  }
}
