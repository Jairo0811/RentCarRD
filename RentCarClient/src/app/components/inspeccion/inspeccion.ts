import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';

import { Cliente, Inspeccion, Vehiculo } from '../../interfaces/modelos';
import { AuthService } from '../../services/auth.service';
import { ClienteService } from '../../services/cliente.service';
import { InspeccionService } from '../../services/inspeccion.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { confirmar, mensajeError, notificar } from '../../shared/alertas';
import { fechaLocalISO, formatearFecha } from '../../shared/fechas';

export const NIVELES_COMBUSTIBLE = ['1/4', '1/2', '3/4', 'Lleno'] as const;

/** Neumáticos: claves que la API espera (antes se enviaban "estadoGomasXX" y se perdían). */
export const NEUMATICOS = [
  { clave: 'gomaDelanteraIzquierda', etiqueta: 'Delantera izquierda' },
  { clave: 'gomaDelanteraDerecha', etiqueta: 'Delantera derecha' },
  { clave: 'gomaTraseraIzquierda', etiqueta: 'Trasera izquierda' },
  { clave: 'gomaTraseraDerecha', etiqueta: 'Trasera derecha' },
] as const;

/**
 * Inspección de flota (solo Admin: la ruta tiene guard por rol y la API responde 403 a otros roles).
 * El inspector no se envía: la API lo toma del JWT y lo conserva al editar.
 */
@Component({
  selector: 'app-inspeccion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './inspeccion.html',
})
export class InspeccionComponent implements OnInit {
  private readonly inspeccionService = inject(InspeccionService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly clienteService = inject(ClienteService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly esAdmin = inject(AuthService).esAdmin;

  readonly niveles = NIVELES_COMBUSTIBLE;
  readonly neumaticos = NEUMATICOS;
  readonly hoy = fechaLocalISO();

  inspecciones: Inspeccion[] = [];
  vehiculos: Vehiculo[] = [];
  clientes: Cliente[] = [];
  modoEdicion = false;
  cargando = true;
  guardando = false;
  errorCarga = '';

  inspeccionActual: Inspeccion = this.resetForm();

  ngOnInit(): void {
    if (this.esAdmin()) {
      this.cargarDatos();
    }
  }

  cargarDatos(): void {
    this.cargando = true;
    this.errorCarga = '';
    forkJoin({
      inspecciones: this.inspeccionService.getInspecciones(),
      vehiculos: this.vehiculoService.getVehiculos(),
      clientes: this.clienteService.getClientes(),
    }).subscribe({
      next: ({ inspecciones, vehiculos, clientes }) => {
        this.inspecciones = [...inspecciones];
        this.vehiculos = [...vehiculos];
        this.clientes = [...clientes];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorCarga = mensajeError(error, 'No se pudieron cargar las inspecciones.');
        this.cdr.markForCheck();
      },
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
      gomaDelanteraDerecha: true,
      gomaDelanteraIzquierda: true,
      gomaTraseraDerecha: true,
      gomaTraseraIzquierda: true,
      fecha: fechaLocalISO(),
      estado: true,
    };
  }

  guardarInspeccion(): void {
    const { idVehiculo, idCliente, cantidadCombustible, fecha } = this.inspeccionActual;
    if (!idVehiculo || !idCliente || !cantidadCombustible) {
      void notificar('Selecciona el vehículo, el cliente y el nivel de combustible.', 'warning');
      return;
    }
    if (fecha && fecha.slice(0, 10) > this.hoy) {
      void notificar('La fecha de inspección no puede estar en el futuro.', 'warning');
      return;
    }
    if (this.guardando) return;
    this.guardando = true;

    const inspeccion: Inspeccion = {
      ...this.inspeccionActual,
      idVehiculo: Number(idVehiculo),
      idCliente: Number(idCliente),
      fecha: (fecha || this.hoy).slice(0, 10),
    };

    const editando = this.modoEdicion && !!inspeccion.idTransaccion;
    const operacion: Observable<unknown> = editando
      ? this.inspeccionService.actualizarInspeccion(inspeccion)
      : this.inspeccionService.crearInspeccion(inspeccion);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        void notificar(editando ? 'Inspección actualizada correctamente.' : 'Inspección registrada correctamente.', 'success');
        this.cancelar();
        this.cargarDatos();
      },
      error: (err: unknown) => {
        this.guardando = false;
        void notificar(mensajeError(err, 'Ocurrió un error al guardar la inspección.'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  editar(inspeccion: Inspeccion): void {
    this.inspeccionActual = { ...inspeccion, fecha: (inspeccion.fecha ?? '').slice(0, 10) };
    this.modoEdicion = true;
  }

  async eliminar(inspeccion: Inspeccion): Promise<void> {
    const id = inspeccion.idTransaccion;
    if (!id) return;
    const confirmado = await confirmar(`Se eliminará la inspección #${id}. Esta acción no se puede deshacer.`, {
      titulo: '¿Eliminar inspección?',
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.inspeccionService.eliminarInspeccion(id).subscribe({
      next: () => {
        void notificar('Inspección eliminada correctamente.', 'success');
        this.cargarDatos();
      },
      error: (err: unknown) => void notificar(mensajeError(err, 'No se pudo eliminar la inspección.'), 'error'),
    });
  }

  cancelar(): void {
    this.inspeccionActual = this.resetForm();
    this.modoEdicion = false;
    this.guardando = false;
    this.cdr.markForCheck();
  }

  obtenerVehiculo(idVehiculo: number | null): string {
    const vehiculo = this.vehiculos.find((v) => v.id === Number(idVehiculo));
    return vehiculo ? `${vehiculo.descripcion} - ${vehiculo.noPlaca}` : 'N/A';
  }

  obtenerCliente(idCliente: number | null): string {
    return this.clientes.find((c) => c.id === Number(idCliente))?.nombre ?? 'N/A';
  }

  neumaticosEnBuenEstado(i: Inspeccion): number {
    return NEUMATICOS.filter((n) => i[n.clave]).length;
  }

  fecha(valor: string | null | undefined): string {
    return formatearFecha(valor, 'N/D');
  }
}
