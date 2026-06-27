import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { RentaService } from '../../services/renta.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { ClienteService } from '../../services/cliente.service';
import { InspeccionService } from '../../services/inspeccion.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {

  vehiculos: any[] = [];
  clientes: any[] = [];
  rentas: any[] = [];
  inspecciones: any[] = [];

  totalVehiculos = 0;
  vehiculosDisponibles = 0;
  vehiculosRentados = 0;
  totalClientes = 0;
  rentasActivas = 0;
  rentasConcluidas = 0;
  totalInspecciones = 0;
  ingresosTotales = 0;

  ultimasRentas: any[] = [];
  vehiculosRecientes: any[] = [];

  constructor(
    private rentaService: RentaService,
    private vehiculoService: VehiculoService,
    private clienteService: ClienteService,
    private inspeccionService: InspeccionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => this.cargarDashboard(), 0);
  }

  cargarDashboard(): void {
    forkJoin({
      vehiculos: this.vehiculoService.getVehiculos(),
      clientes: this.clienteService.getClientes(),
      rentas: this.rentaService.getRentas(),
      inspecciones: this.inspeccionService.getInspecciones()
    }).subscribe({
      next: ({ vehiculos, clientes, rentas, inspecciones }: any) => {
        this.vehiculos = [...vehiculos];
        this.clientes = [...clientes];
        this.rentas = [...rentas];
        this.inspecciones = [...inspecciones];

        this.totalVehiculos = this.vehiculos.length;
        this.vehiculosDisponibles = this.vehiculos.filter(v => v.estado === true).length;
        this.vehiculosRentados = this.vehiculos.filter(v => v.estado === false).length;

        this.totalClientes = this.clientes.length;

        this.rentasActivas = this.rentas.filter(r => r.estado === 'Activa' || r.estado === 'Abierta').length;
        this.rentasConcluidas = this.rentas.filter(r => r.estado === 'Concluida').length;

        this.totalInspecciones = this.inspecciones.length;

        this.ingresosTotales = this.rentas.reduce((total: number, renta: any) => {
          const monto = Number(renta.montoXDia ?? renta.montoXdia ?? 0);
          const dias = Number(renta.cantidadDias ?? 0);
          return total + (monto * dias);
        }, 0);

        this.ultimasRentas = [...this.rentas]
          .sort((a, b) => Number(b.noRenta ?? 0) - Number(a.noRenta ?? 0))
          .slice(0, 5);

        this.vehiculosRecientes = [...this.vehiculos]
          .sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0))
          .slice(0, 4);

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando dashboard', err);
      }
    });
  }

  obtenerCliente(idCliente: number): string {
    const cliente = this.clientes.find(c => Number(c.id) === Number(idCliente));
    return cliente ? cliente.nombre : 'N/A';
  }

  obtenerVehiculo(idVehiculo: number): string {
    const vehiculo = this.vehiculos.find(v => Number(v.id) === Number(idVehiculo));
    return vehiculo ? vehiculo.descripcion : 'N/A';
  }

  obtenerMontoDia(renta: any): number {
    return Number(renta.montoXDia ?? renta.montoXdia ?? 0);
  }

  obtenerTotal(renta: any): number {
    return this.obtenerMontoDia(renta) * Number(renta.cantidadDias ?? 0);
  }

  formatoRD(valor: number): string {
    return `RD$ ${Number(valor || 0).toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  porcentajeDisponibles(): number {
    if (this.totalVehiculos === 0) return 0;
    return Math.round((this.vehiculosDisponibles / this.totalVehiculos) * 100);
  }

  porcentajeRentados(): number {
    if (this.totalVehiculos === 0) return 0;
    return Math.round((this.vehiculosRentados / this.totalVehiculos) * 100);
  }

  fechaActual(): string {
    return new Date().toLocaleDateString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}