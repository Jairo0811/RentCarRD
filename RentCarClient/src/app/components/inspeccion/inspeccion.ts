import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { InspeccionService } from '../../services/inspeccion.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { ClienteService } from '../../services/cliente.service';

export interface Inspeccion {
  id?: number;
  idTransaccion?: number;
  idVehiculo: number | null;
  idCliente: number | null;
  tieneRalladuras: boolean;
  cantidadCombustible: string;
  tieneGomaRespuesta: boolean;
  tieneGato: boolean;
  tieneRoturasCristal: boolean;
  estadoGomasDD: boolean;
  estadoGomasDI: boolean;
  estadoGomasTD: boolean;
  estadoGomasTI: boolean;
  fecha: string;
  idEmpleadoInspeccion: number | null;
  estado: boolean;
}

@Component({
  selector: 'app-inspeccion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inspeccion.html'
})
export class InspeccionComponent implements OnInit {

  inspecciones: any[] = [];
  vehiculos: any[] = [];
  clientes: any[] = [];
  modoEdicion = false;

  inspeccionActual: Inspeccion = this.resetForm();

  constructor(
    private inspeccionService: InspeccionService,
    private vehiculoService: VehiculoService,
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  get rolActual(): string | null {
    return localStorage.getItem('rolUsuario');
  }

  ngOnInit(): void {
    if (this.rolActual !== 'admin') {
      return;
    }

    setTimeout(() => this.cargarDatos(), 0);
  }

  cargarDatos(): void {
    this.inspeccionService.getInspecciones().subscribe({
      next: (data: any[]) => {
        this.inspecciones = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando inspecciones', err);
      }
    });

    this.vehiculoService.getVehiculos().subscribe({
      next: (data: any[]) => {
        this.vehiculos = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando vehículos', err);
      }
    });

    this.clienteService.getClientes().subscribe({
      next: (data: any[]) => {
        this.clientes = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando clientes', err);
      }
    });
  }

  resetForm(): Inspeccion {
    return {
      idVehiculo: null,
      idCliente: null,
      tieneRalladuras: false,
      cantidadCombustible: '',
      tieneGomaRespuesta: true,
      tieneGato: true,
      tieneRoturasCristal: false,
      estadoGomasDD: true,
      estadoGomasDI: true,
      estadoGomasTD: true,
      estadoGomasTI: true,
      fecha: new Date().toISOString(),
      idEmpleadoInspeccion: 1,
      estado: true
    };
  }

  guardarInspeccion(): void {
    if (this.rolActual !== 'admin') {
      return;
    }

    if (
      !this.inspeccionActual.idVehiculo ||
      !this.inspeccionActual.idCliente ||
      !this.inspeccionActual.cantidadCombustible
    ) {
      alert('Selecciona el vehículo, el cliente y el nivel de combustible.');
      return;
    }

    const inspeccionEnviar = {
      ...this.inspeccionActual,
      idVehiculo: Number(this.inspeccionActual.idVehiculo),
      idCliente: Number(this.inspeccionActual.idCliente),
      idEmpleadoInspeccion: 1,
      fecha: this.inspeccionActual.fecha || new Date().toISOString(),
      estado: true
    };

    if (this.modoEdicion) {
      this.inspeccionService.actualizarInspeccion(inspeccionEnviar).subscribe({
        next: () => {
          alert('Inspección actualizada correctamente.');
          this.cancelar();
          this.cargarDatos();
        },
        error: (err: any) => {
          console.error('Error al actualizar inspección', err);
          alert('Ocurrió un error al actualizar la inspección.');
        }
      });
    } else {
      this.inspeccionService.crearInspeccion(inspeccionEnviar).subscribe({
        next: () => {
          alert('Inspección registrada correctamente.');
          this.cancelar();
          this.cargarDatos();
        },
        error: (err: any) => {
          console.error('Error al guardar inspección', err);
          alert('Ocurrió un error al guardar la inspección.');
        }
      });
    }
  }

  editar(inspeccion: any): void {
    this.inspeccionActual = {
      id: inspeccion.id,
      idTransaccion: inspeccion.idTransaccion,
      idVehiculo: inspeccion.idVehiculo,
      idCliente: inspeccion.idCliente,
      tieneRalladuras: inspeccion.tieneRalladuras,
      cantidadCombustible: inspeccion.cantidadCombustible,
      tieneGomaRespuesta: inspeccion.tieneGomaRespuesta,
      tieneGato: inspeccion.tieneGato,
      tieneRoturasCristal: inspeccion.tieneRoturasCristal,
      estadoGomasDD: inspeccion.estadoGomasDD,
      estadoGomasDI: inspeccion.estadoGomasDI,
      estadoGomasTD: inspeccion.estadoGomasTD,
      estadoGomasTI: inspeccion.estadoGomasTI,
      fecha: inspeccion.fecha,
      idEmpleadoInspeccion: inspeccion.idEmpleadoInspeccion,
      estado: inspeccion.estado
    };

    this.modoEdicion = true;
    this.cdr.detectChanges();
  }

  eliminar(inspeccion: any): void {
    const id = inspeccion.idTransaccion ?? inspeccion.id;

    if (!id) {
      return;
    }

    if (!confirm('¿Deseas eliminar esta inspección?')) {
      return;
    }

    this.inspeccionService.eliminarInspeccion(id).subscribe({
      next: () => {
        alert('Inspección eliminada correctamente.');
        this.cargarDatos();
      },
      error: (err: any) => {
        console.error('Error al eliminar inspección', err);
        alert('No se pudo eliminar la inspección.');
      }
    });
  }

  cancelar(): void {
    this.inspeccionActual = this.resetForm();
    this.modoEdicion = false;
    this.cdr.detectChanges();
  }

  obtenerVehiculo(idVehiculo: number): string {
    const vehiculo = this.vehiculos.find(v => Number(v.id) === Number(idVehiculo));
    return vehiculo ? `${vehiculo.descripcion} - ${vehiculo.noPlaca}` : 'N/A';
  }

  obtenerCliente(idCliente: number): string {
    const cliente = this.clientes.find(c => Number(c.id) === Number(idCliente));
    return cliente ? cliente.nombre : 'N/A';
  }
}