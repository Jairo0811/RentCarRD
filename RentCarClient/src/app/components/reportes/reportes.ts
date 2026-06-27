import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RentaService } from '../../services/renta.service';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styles: [`
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      body { background-color: white; }
    }
  `],
})
export class ReportesComponent implements OnInit {
  todasLasRentas: any[] = [];

  filtroFechaDesde = '';
  filtroFechaHasta = '';
  filtroCliente = '';
  filtroVehiculo = '';
  filtroEstado = '';

  constructor(
    private rentaService: RentaService,
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

    setTimeout(() => this.cargarRentas(), 0);
  }

  cargarRentas(): void {
    this.rentaService.getRentas().subscribe({
      next: (data: any[]) => {
        this.todasLasRentas = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar rentas', err);
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
      const monto = Number(renta.montoXDia ?? renta.montoXdia ?? 0);
      const dias = Number(renta.cantidadDias ?? 0);
      return total + (monto * dias);
    }, 0);
  }

  obtenerMontoDia(renta: any): number {
    return Number(renta.montoXDia ?? renta.montoXdia ?? 0);
  }

  obtenerTotal(renta: any): number {
    return this.obtenerMontoDia(renta) * Number(renta.cantidadDias ?? 0);
  }

  limpiarFiltros(): void {
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroCliente = '';
    this.filtroVehiculo = '';
    this.filtroEstado = '';
    this.cdr.detectChanges();
  }

  imprimirReporte(): void {
    window.print();
  }
}