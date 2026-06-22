import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router'; // IMPORTANTE: Agregado
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

  // Modelos para los filtros
  filtroFechaDesde: string = '';
  filtroFechaHasta: string = '';
  filtroCliente: string = '';
  filtroVehiculo: string = '';
  filtroEstado: string = '';

  constructor(private rentaService: RentaService, private router: Router) {}

  get rolActual(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('rolUsuario');
    }
    return null;
  }

  ngOnInit(): void {
    if (this.rolActual !== 'admin') {
      // Redirección profesional sin alert
      this.router.navigate(['/']); 
      return;
    }
    this.cargarRentas();
  }

  cargarRentas() {
    this.rentaService.getRentas().subscribe({
      next: (data: any) => (this.todasLasRentas = data),
      error: (err: any) => console.error('Error al cargar rentas', err),
    });
  }

  get rentasFiltradas(): any[] {
    return this.todasLasRentas.filter((renta) => {
      let cumpleFechaDesde = this.filtroFechaDesde
        ? new Date(renta.fechaRenta) >= new Date(this.filtroFechaDesde)
        : true;
      let cumpleFechaHasta = this.filtroFechaHasta
        ? new Date(renta.fechaRenta) <= new Date(this.filtroFechaHasta)
        : true;

      let cumpleCliente = this.filtroCliente
        ? String(renta.idCliente).includes(this.filtroCliente)
        : true;
      let cumpleVehiculo = this.filtroVehiculo
        ? String(renta.idVehiculo).includes(this.filtroVehiculo)
        : true;
      let cumpleEstado = this.filtroEstado
        ? renta.estado.toLowerCase() === this.filtroEstado.toLowerCase()
        : true;

      return (
        cumpleFechaDesde && cumpleFechaHasta && cumpleCliente && cumpleVehiculo && cumpleEstado
      );
    });
  }

  get totalMontoGenerado(): number {
    return this.rentasFiltradas.reduce((total, renta) => {
      const monto = renta.montoXDia || 0;
      const dias = renta.cantidadDias || 0;
      return total + monto * dias;
    }, 0);
  }

  limpiarFiltros() {
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.filtroCliente = '';
    this.filtroVehiculo = '';
    this.filtroEstado = '';
  }

  imprimirReporte() {
    window.print();
  }
}