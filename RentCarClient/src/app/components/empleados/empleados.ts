import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { EmpleadoService } from '../../services/empleado.service';

export interface Empleado {
  id?: number;
  nombre: string;
  cedula: string;
  usuario: string;       // <-- Agregado para coincidir con C#
  tandaLabor: string;     // <-- ¡Corregido para coincidir con C#!
  porcientoComision: number;
  fechaIngreso: string;   // <-- ¡Agregado porque C# lo exige!
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
  
  empleadoActual: Empleado = { 
    nombre: '', 
    cedula: '', 
    usuario: '',        // <-- Agregado para coincidir con C#
    tandaLabor: '',       // <-- Corregido
    porcientoComision: 0, 
    fechaIngreso: new Date().toISOString(), // <-- Envía la fecha de hoy automáticamente
    estado: true 
  };

  constructor(private empleadoService: EmpleadoService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { 
   setTimeout(() => this.cargarDatos(), 0); 
  }

  cargarDatos(): void {
  this.empleadoService.getEmpleados().subscribe({
    next: (data: Empleado[]) => {
      this.listaEmpleados = [...data];
      this.cdr.detectChanges();
    },
    error: (err: any) =>
      console.error('Error al cargar empleados', err)
  });
}

guardar(): void {
    // 1. Validar campos vacíos
    if (!this.empleadoActual.nombre || !this.empleadoActual.cedula || !this.empleadoActual.usuario) {
      return alert('El Nombre, Usuario y Cédula son obligatorios.');
    }

    // 2. NUEVO: Validar que la cédula no esté repetida visualmente
    const cedulaDuplicada = this.listaEmpleados.some(
      emp => emp.cedula === this.empleadoActual.cedula
    );

    if (cedulaDuplicada) {
      return alert('¡Error! Ya existe un empleado registrado con la cédula ' + this.empleadoActual.cedula);
    }

    // 3. Si todo está bien, enviamos a la API
    this.empleadoService.crearEmpleado(this.empleadoActual).subscribe({
      next: () => { 
        alert('¡Empleado guardado con éxito!'); 
        this.cargarDatos(); 
        
        this.empleadoActual = { 
          nombre: '', 
          usuario: '',
          cedula: '', 
          tandaLabor: '', 
          porcientoComision: 0, 
          fechaIngreso: new Date().toISOString(),
          estado: true 
        }; 
      },
      error: (err) => {
        // Mostramos el mensaje exacto que nos envía C# (si lo hay)
        if (err.error && typeof err.error === 'string') {
          alert('Error del Servidor: ' + err.error);
        } else {
          console.error('Error al guardar', err);
          alert('Ocurrió un error al guardar. Revisa la consola.');
        }
      }
    });
  }
  eliminar(id: number | undefined): void {
    if (id && confirm('¿Estás seguro de eliminar este empleado?')) {
      this.empleadoService.deleteEmpleado(id).subscribe({
        next: () => this.cargarDatos(),
        error: (err) => console.error('Error al eliminar', err)
      });
    }
  }
}