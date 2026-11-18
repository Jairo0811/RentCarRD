import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Cliente, EstadoVehiculo, Renta, Vehiculo, estadoOperativo } from '../../interfaces/modelos';
import { ClienteService } from '../../services/cliente.service';
import { InspeccionService } from '../../services/inspeccion.service';
import { RentaService } from '../../services/renta.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { environment } from '../../../environments/environment';
import { mensajeError } from '../../shared/alertas';
import { Desglose, desgloseRenta, formatoRD, sumarDesgloses } from '../../shared/montos';

export interface IndicadoresFlota {
  total: number;
  disponibles: number;
  rentados: number;
  noDisponibles: number;
}

export interface IndicadoresRentas {
  activas: number;
  concluidas: number;
  /** Suma de subtotal, ITBIS y total pactados en todas las rentas (no son cobros). */
  contratado: Desglose;
  /** Mismo desglose, solo de rentas concluidas. */
  contratadoConcluidas: Desglose;
}

/** Cuenta la flota por su estado operativo real (EstadoOperacion), no por el booleano heredado. */
export function indicadoresFlota(vehiculos: Vehiculo[]): IndicadoresFlota {
  const cuenta: Record<EstadoVehiculo, number> = { Disponible: 0, Rentado: 0, NoDisponible: 0 };
  for (const vehiculo of vehiculos) {
    cuenta[estadoOperativo(vehiculo)]++;
  }
  return { total: vehiculos.length, disponibles: cuenta.Disponible, rentados: cuenta.Rentado, noDisponibles: cuenta.NoDisponible };
}

/**
 * Indicadores de rentas. El importe usa los valores persistidos por la API (subtotal + ITBIS del
 * 18 %). RentCarRD no tiene módulo de cobros, así que se presenta como "importe contratado" y
 * nunca como ingresos cobrados.
 */
export function indicadoresRentas(rentas: Renta[]): IndicadoresRentas {
  const concluidas = rentas.filter((renta) => renta.estado === 'Concluida');
  return {
    activas: rentas.filter((renta) => renta.estado === 'Activa').length,
    concluidas: concluidas.length,
    contratado: sumarDesgloses(rentas.map(desgloseRenta)),
    contratadoConcluidas: sumarDesgloses(concluidas.map(desgloseRenta)),
  };
}

export function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly rentaService = inject(RentaService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly clienteService = inject(ClienteService);
  private readonly inspeccionService = inject(InspeccionService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly apiBaseUrl = environment.apiBaseUrl;
  readonly formatoRD = formatoRD;
  readonly estadoOperativo = estadoOperativo;

  cargando = true;
  errorCarga = '';

  vehiculos: Vehiculo[] = [];
  clientes: Cliente[] = [];
  flota: IndicadoresFlota = { total: 0, disponibles: 0, rentados: 0, noDisponibles: 0 };
  rentasIndicadores: IndicadoresRentas = indicadoresRentas([]);
  totalClientes = 0;
  totalInspecciones = 0;

  ultimasRentas: Renta[] = [];
  vehiculosRecientes: Vehiculo[] = [];

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.cargando = true;
    this.errorCarga = '';
    forkJoin({
      vehiculos: this.vehiculoService.getVehiculos(),
      clientes: this.clienteService.getClientes(),
      rentas: this.rentaService.getRentas(),
      inspecciones: this.inspeccionService.getInspecciones(),
    }).subscribe({
      next: ({ vehiculos, clientes, rentas, inspecciones }) => {
        this.vehiculos = [...vehiculos];
        this.clientes = [...clientes];
        this.flota = indicadoresFlota(vehiculos);
        this.rentasIndicadores = indicadoresRentas(rentas);
        this.totalClientes = clientes.length;
        this.totalInspecciones = inspecciones.length;
        this.ultimasRentas = [...rentas].sort((a, b) => b.noRenta - a.noRenta).slice(0, 5);
        this.vehiculosRecientes = [...vehiculos].sort((a, b) => Number(b.id ?? 0) - Number(a.id ?? 0)).slice(0, 4);
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorCarga = mensajeError(error, 'No se pudo cargar el panel.');
        this.cdr.markForCheck();
      },
    });
  }

  obtenerCliente(idCliente: number): string {
    return this.clientes.find((c) => c.id === idCliente)?.nombre ?? 'N/A';
  }

  obtenerVehiculo(idVehiculo: number): string {
    return this.vehiculos.find((v) => v.id === idVehiculo)?.descripcion ?? 'N/A';
  }

  totalRenta(renta: Renta): number {
    return desgloseRenta(renta).total;
  }

  porcentaje(parte: number): number {
    return porcentaje(parte, this.flota.total);
  }

  etiquetaEstado(estado: EstadoVehiculo): string {
    return estado === 'NoDisponible' ? 'No disponible' : estado;
  }

  fechaActual(): string {
    return new Date().toLocaleDateString('es-DO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}
