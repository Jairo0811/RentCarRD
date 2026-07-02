import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { RentaService } from '../../services/renta.service';
import { ClienteService } from '../../services/cliente.service';
import { VehiculoService } from '../../services/vehiculo.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html'
})
export class ReportesComponent implements OnInit {
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
    correo: 'info@rentcarrd.com'
  };

  constructor(
    private rentaService: RentaService,
    private clienteService: ClienteService,
    private vehiculoService: VehiculoService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  get rolActual(): string | null {
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
      vehiculos: this.vehiculoService.getVehiculos()
    }).subscribe({
      next: ({ rentas, clientes, vehiculos }: any) => {
        this.todasLasRentas = [...rentas];
        this.clientes = [...clientes];
        this.vehiculos = [...vehiculos];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar datos del reporte', err);
      }
    });
  }

  get rentasFiltradas(): any[] {
    return this.todasLasRentas.filter((renta: any) => {
      const fechaRenta = new Date(renta.fechaRenta);

      const cumpleFechaDesde = this.filtroFechaDesde
        ? fechaRenta >= new Date(this.filtroFechaDesde)
        : true;

      const cumpleFechaHasta = this.filtroFechaHasta
        ? fechaRenta <= new Date(this.filtroFechaHasta)
        : true;

      const cumpleCliente = this.filtroCliente
        ? String(renta.idCliente).includes(this.filtroCliente)
        : true;

      const cumpleVehiculo = this.filtroVehiculo
        ? String(renta.idVehiculo).includes(this.filtroVehiculo)
        : true;

      const cumpleEstado = this.filtroEstado
        ? String(renta.estado).toLowerCase() === this.filtroEstado.toLowerCase()
        : true;

      return cumpleFechaDesde && cumpleFechaHasta && cumpleCliente && cumpleVehiculo && cumpleEstado;
    });
  }

  get totalMontoGenerado(): number {
    return this.rentasFiltradas.reduce((total: number, renta: any) => {
      return total + this.obtenerTotal(renta);
    }, 0);
  }

  obtenerMontoDia(renta: any): number {
    return Number(renta.montoXDia ?? renta.montoXdia ?? 0);
  }

  obtenerTotal(renta: any): number {
    return this.obtenerMontoDia(renta) * Number(renta.cantidadDias ?? 0);
  }

  obtenerCliente(idCliente: number): string {
    const cliente = this.clientes.find(c => Number(c.id) === Number(idCliente));
    return cliente ? cliente.nombre : `Cliente ID ${idCliente}`;
  }

  obtenerVehiculo(idVehiculo: number): string {
    const vehiculo = this.vehiculos.find(v => Number(v.id) === Number(idVehiculo));
    return vehiculo ? vehiculo.descripcion : `Vehículo ID ${idVehiculo}`;
  }

  formatoRD(valor: number): string {
    return `RD$ ${Number(valor || 0).toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
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
      .then(response => response.blob())
      .then(blob => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }))
      .catch(() => null);
  }

  async imprimirReporte(): Promise<void> {
    const logoBase64 = await this.cargarLogoBase64();

    const doc = new jsPDF('landscape');

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
      styles: { fontSize: 9 },
      headStyles: { fillColor: [25, 66, 120], textColor: 255 },
      head: [['Fecha de Generación', 'Fecha Desde', 'Fecha Hasta', 'Cliente', 'Vehículo', 'Estado']],
      body: [[
        new Date().toLocaleString('es-DO'),
        this.filtroFechaDesde || 'Todas',
        this.filtroFechaHasta || 'Todas',
        this.filtroCliente || 'Todos',
        this.filtroVehiculo || 'Todos',
        this.filtroEstado || 'Todos'
      ]]
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      theme: 'striped',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 37, 41], textColor: 255 },
      head: [['No. Renta', 'Fecha', 'Cliente', 'Vehículo', 'Días', 'Tarifa', 'Total', 'Estado']],
      body: this.rentasFiltradas.map((renta: any) => [
        `#${renta.noRenta ?? renta.id}`,
        new Date(renta.fechaRenta).toLocaleDateString('es-DO'),
        this.obtenerCliente(renta.idCliente),
        this.obtenerVehiculo(renta.idVehiculo),
        `${renta.cantidadDias ?? 0}`,
        this.formatoRD(this.obtenerMontoDia(renta)),
        this.formatoRD(this.obtenerTotal(renta)),
        renta.estado ?? 'N/A'
      ])
    });

    const activas = this.rentasFiltradas.filter(r =>
      r.estado === 'Activa' || r.estado === 'Abierta'
    ).length;

    const concluidas = this.rentasFiltradas.filter(r =>
      r.estado === 'Concluida'
    ).length;

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: 'grid',
      styles: { fontSize: 10, halign: 'center' },
      headStyles: { fillColor: [25, 66, 120], textColor: 255 },
      head: [['Rentas Encontradas', 'Rentas Activas', 'Rentas Concluidas', 'Total Generado']],
      body: [[
        this.rentasFiltradas.length,
        activas,
        concluidas,
        this.formatoRD(this.totalMontoGenerado)
      ]]
    });

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `Generado por Francis Jairo Matías Rosario - RentCarRD | ${new Date().toLocaleString('es-DO')}`,
      148,
      200,
      { align: 'center' }
    );

    doc.save(`Reporte_Rentas_${new Date().getTime()}.pdf`);
  }
}