import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from '../../services/empleado.service';

export interface Empleado {
  id?: number;
  nombre: string;
  cedula: string;
  usuario: string;
  tandaLabor: string;
  porcientoComision: number;
  fechaIngreso: string;
  estado: boolean;
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

  modoEdicion = false;

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
      tandaLabor: '',
      porcientoComision: 0,
      fechaIngreso: new Date().toISOString(),
      estado: true
    };
  }

  cargarDatos(): void {
    this.empleadoService.getEmpleados().subscribe({
      next: (data: Empleado[]) => {
        this.listaEmpleados = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar empleados', err);
      }
    });
  }

  guardar(): void {
    if (!this.empleadoActual.nombre || !this.empleadoActual.cedula || !this.empleadoActual.usuario) {
      alert('El nombre, usuario y cédula son obligatorios.');
      return;
    }

    if (Number(this.empleadoActual.porcientoComision) < 0) {
      alert('El porcentaje de comisión no puede ser negativo.');
      return;
    }

    const cedulaLimpia = this.limpiarCedula(this.empleadoActual.cedula);

    if (!this.cedulaValida(cedulaLimpia)) {
      alert('La cédula ingresada no es válida.');
      return;
    }

    if (!this.cedulaEsValida) {
      alert(this.mensajeCedula || 'Debes validar una cédula válida y disponible.');
      return;
    }

    const empleadoEnviar: Empleado = {
      ...this.empleadoActual,
      cedula: cedulaLimpia,
      porcientoComision: Number(this.empleadoActual.porcientoComision),
      fechaIngreso: this.empleadoActual.fechaIngreso || new Date().toISOString()
    };

    if (this.modoEdicion) {
      this.empleadoService.actualizarEmpleado(empleadoEnviar).subscribe({
        next: () => {
          alert('Empleado actualizado correctamente.');
          this.cancelar();
          this.cargarDatos();
        },
        error: (err: any) => {
          console.error('Error al actualizar empleado', err);
          alert(err.error || 'Ocurrió un error al actualizar el empleado.');
        }
      });
    } else {
      this.empleadoService.crearEmpleado(empleadoEnviar).subscribe({
        next: () => {
          alert('Empleado guardado con éxito.');
          this.cancelar();
          this.cargarDatos();
        },
        error: (err: any) => {
          console.error('Error al guardar empleado', err);
          alert(err.error || 'Ocurrió un error al guardar el empleado.');
        }
      });
    }
  }

  editar(empleado: Empleado): void {
    this.empleadoActual = {
      ...empleado,
      cedula: this.formatearCedula(empleado.cedula),
      fechaIngreso: empleado.fechaIngreso || new Date().toISOString()
    };

    this.modoEdicion = true;
    this.validarCedulaApi();
    this.cdr.detectChanges();
  }

  eliminar(id: number | undefined): void {
    if (!id) return;

    if (!confirm('¿Estás seguro de eliminar este empleado?')) return;

    this.empleadoService.deleteEmpleado(id).subscribe({
      next: () => {
        alert('Empleado eliminado correctamente.');
        this.cargarDatos();
      },
      error: (err: any) => {
        console.error('Error al eliminar empleado', err);
        alert('No se pudo eliminar el empleado. Puede estar relacionado con una renta.');
      }
    });
  }

  cancelar(): void {
    this.empleadoActual = this.crearEmpleadoVacio();
    this.modoEdicion = false;
    this.mensajeCedula = '';
    this.cedulaEsValida = false;
    this.validandoCedula = false;
    this.cdr.detectChanges();
  }

  limpiarCedula(cedula: string): string {
    return (cedula || '').replace(/\D/g, '').slice(0, 11);
  }

  formatearCedula(cedula: string): string {
    const limpia = this.limpiarCedula(cedula);

    if (limpia.length <= 3) {
      return limpia;
    }

    if (limpia.length <= 10) {
      return `${limpia.slice(0, 3)}-${limpia.slice(3)}`;
    }

    return `${limpia.slice(0, 3)}-${limpia.slice(3, 10)}-${limpia.slice(10, 11)}`;
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
      next: (respuesta: any) => {
        this.cedulaEsValida = respuesta.esValida;
        this.mensajeCedula = respuesta.mensaje;
        this.validandoCedula = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error validando cédula del empleado', err);
        this.mensajeCedula = 'No se pudo validar la cédula.';
        this.cedulaEsValida = false;
        this.validandoCedula = false;
        this.cdr.detectChanges();
      }
    });
  }

  cedulaValida(cedula: string): boolean {
    cedula = this.limpiarCedula(cedula);

    if (cedula.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cedula)) return false;

    const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 10; i++) {
      let valor = Number(cedula[i]) * pesos[i];

      if (valor >= 10) {
        valor = Math.floor(valor / 10) + (valor % 10);
      }

      suma += valor;
    }

    const digitoVerificador = (10 - (suma % 10)) % 10;

    return digitoVerificador === Number(cedula[10]);
  }

  formatearCedulaListado(cedula: string): string {
    return this.formatearCedula(cedula);
  }
}