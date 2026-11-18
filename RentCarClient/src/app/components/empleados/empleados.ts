import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from '../../services/empleado.service';
import { Observable } from 'rxjs';
import { Empleado } from '../../interfaces/modelos';
import { confirmar, mensajeError, notificar } from '../../shared/alertas';
import { cedulaValida, formatearDocumento, soloDigitos } from '../../shared/documentos';
import { fechaLocalISO } from '../../shared/fechas';

export const TANDAS = ['Matutina', 'Vespertina', 'Nocturna'] as const;

/** Misma política que la API: 8–128 caracteres, con al menos una letra y un número. */
export function validarPassword(password: string | undefined | null, obligatoria: boolean): string | null {
  if (!password) return obligatoria ? 'La contraseña inicial es obligatoria.' : null;
  if (password.length < 8 || password.length > 128) return 'La contraseña debe tener entre 8 y 128 caracteres.';
  if (!/\p{L}/u.test(password) || !/\d/.test(password)) return 'La contraseña debe contener al menos una letra y un número.';
  return null;
}

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './empleados.html',
  styleUrls: ['./empleados.css']
})
export class EmpleadosComponent implements OnInit {
  listaEmpleados: Empleado[] = [];
  readonly tandas = TANDAS;

  modoEdicion = false;
  guardando = false;
  cargando = true;

  mensajeCedula = '';
  cedulaEsValida = false;
  validandoCedula = false;

  empleadoActual: Empleado = this.crearEmpleadoVacio();

  constructor(
    private empleadoService: EmpleadoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => this.cargarDatos(), 0);
  }

  crearEmpleadoVacio(): Empleado {
    return {
      nombre: '',
      cedula: '',
      usuario: '',
      password: '',
      tandaLabor: '',
      porcientoComision: 0,
      fechaIngreso: fechaLocalISO(),
      estado: true
    };
  }

  cargarDatos(): void {
    this.empleadoService.getEmpleados().subscribe({
      next: (data) => {
        this.listaEmpleados = [...data];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.cargando = false;
        void notificar(mensajeError(err, 'No se pudieron cargar los empleados.'), 'error');
        this.cdr.markForCheck();
      }
    });
  }

  /** Devuelve el mensaje de validación o null si el formulario es correcto. */
  validarFormulario(): string | null {
    const e = this.empleadoActual;
    if (!e.nombre?.trim() || !e.cedula || !e.usuario?.trim()) return 'El nombre, el usuario y la cédula son obligatorios.';
    if (!/^[a-z0-9._-]{3,80}$/.test(e.usuario.trim().toLowerCase())) {
      return 'El usuario debe tener entre 3 y 80 caracteres: letras minúsculas, números, punto, guion o guion bajo.';
    }
    if (!TANDAS.includes(e.tandaLabor as (typeof TANDAS)[number])) return 'Selecciona la tanda laboral.';
    const comision = Number(e.porcientoComision);
    if (!Number.isInteger(comision) || comision < 0 || comision > 100) return 'El porcentaje de comisión debe ser un entero entre 0 y 100.';
    const errorPassword = validarPassword(e.password, !this.modoEdicion);
    if (errorPassword) return errorPassword;
    if (!cedulaValida(e.cedula)) return 'La cédula ingresada no es válida.';
    if (!this.cedulaEsValida) return this.mensajeCedula || 'Debes validar una cédula válida y disponible.';
    return null;
  }

  guardar(): void {
    if (this.guardando) return;
    const error = this.validarFormulario();
    if (error) {
      void notificar(error, 'warning');
      return;
    }

    const empleadoEnviar: Empleado = {
      ...this.empleadoActual,
      nombre: this.empleadoActual.nombre.trim(),
      usuario: this.empleadoActual.usuario.trim().toLowerCase(),
      cedula: soloDigitos(this.empleadoActual.cedula, 11),
      porcientoComision: Number(this.empleadoActual.porcientoComision),
      fechaIngreso: (this.empleadoActual.fechaIngreso || fechaLocalISO()).slice(0, 10),
    };

    this.guardando = true;
    const editando = this.modoEdicion;
    const operacion: Observable<unknown> = editando
      ? this.empleadoService.actualizarEmpleado(empleadoEnviar)
      : this.empleadoService.crearEmpleado(empleadoEnviar);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        void notificar(editando ? 'Empleado actualizado correctamente.' : 'Empleado guardado correctamente.', 'success');
        this.cancelar();
        this.cargarDatos();
      },
      error: (err: unknown) => {
        this.guardando = false;
        void notificar(mensajeError(err, editando ? 'Ocurrió un error al actualizar el empleado.' : 'Ocurrió un error al guardar el empleado.'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  editar(empleado: Empleado): void {
    this.empleadoActual = {
      ...empleado,
      password: '',
      cedula: this.formatearCedula(empleado.cedula),
      fechaIngreso: (empleado.fechaIngreso || fechaLocalISO()).slice(0, 10)
    };

    this.modoEdicion = true;
    this.validarCedulaApi();
    this.cdr.markForCheck();
  }

  async eliminar(empleado: Empleado): Promise<void> {
    if (!empleado.id) return;
    const confirmado = await confirmar(`Se eliminará al empleado "${empleado.nombre}". Si tiene rentas o inspecciones, inactívelo en su lugar.`, {
      titulo: '¿Eliminar empleado?',
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.empleadoService.deleteEmpleado(empleado.id).subscribe({
      next: () => {
        void notificar('Empleado eliminado correctamente.', 'success');
        this.cargarDatos();
      },
      error: (err: unknown) => void notificar(mensajeError(err, 'No se pudo eliminar el empleado. Puede estar relacionado con una renta.'), 'error'),
    });
  }

  cancelar(): void {
    this.empleadoActual = this.crearEmpleadoVacio();
    this.modoEdicion = false;
    this.guardando = false;
    this.mensajeCedula = '';
    this.cedulaEsValida = false;
    this.validandoCedula = false;
    this.cdr.markForCheck();
  }

  limpiarCedula(cedula: string): string {
    return soloDigitos(cedula, 11);
  }

  formatearCedula(cedula: string): string {
    return formatearDocumento(cedula, 'Fisica');
  }

  onCedulaInput(): void {
    this.empleadoActual.cedula = this.formatearCedula(this.empleadoActual.cedula);

    const cedulaLimpia = this.limpiarCedula(this.empleadoActual.cedula);

    this.mensajeCedula = '';
    this.cedulaEsValida = false;

    if (cedulaLimpia.length === 0) return;

    if (cedulaLimpia.length < 11) {
      this.mensajeCedula = 'La cédula debe tener 11 dígitos.';
      return;
    }

    this.validarCedulaApi();
  }

  validarCedulaApi(): void {
    const cedula = this.limpiarCedula(this.empleadoActual.cedula);

    this.mensajeCedula = '';
    this.cedulaEsValida = false;

    if (cedula.length !== 11) {
      this.mensajeCedula = 'La cédula debe tener 11 dígitos.';
      return;
    }

    this.validandoCedula = true;

    this.empleadoService.validarCedula(cedula, this.empleadoActual.id).subscribe({
      next: (respuesta) => {
        this.cedulaEsValida = respuesta.esValida;
        this.mensajeCedula = respuesta.mensaje;
        this.validandoCedula = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.mensajeCedula = mensajeError(err, 'No se pudo validar la cédula.');
        this.cedulaEsValida = false;
        this.validandoCedula = false;
        this.cdr.markForCheck();
      }
    });
  }

  formatearCedulaListado(cedula: string): string {
    return this.formatearCedula(cedula);
  }
}
