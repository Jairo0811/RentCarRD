import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InspeccionService } from '../../services/inspeccion.service';

export interface Inspeccion {
  idTransaccion?: number;
  idVehiculo: number | null;
  idCliente: number | null;
  tieneRalladuras: boolean;
  cantidadCombustible: string;
  tieneGomaRespuesta: boolean;
  tieneGato: boolean;
  tieneRoturasCristal: boolean;
  gomaDelanteraDerecha: boolean;
  gomaDelanteraIzquierda: boolean;
  gomaTraseraDerecha: boolean;
  gomaTraseraIzquierda: boolean;
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
  
  inspeccionActual: Inspeccion = this.resetForm();

  constructor(private inspeccionService: InspeccionService) {}

  // Escudo aplicado aquí
  get rolActual(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('rolUsuario');
    }
    return null;
  }

  ngOnInit(): void {
    if (this.rolActual !== 'admin') {
      alert('Acceso Denegado. Solo los administradores pueden realizar inspecciones.');
    }
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
      fecha: new Date().toISOString(), 
      idEmpleadoInspeccion: 1, 
      estado: true
    };
  }

  guardarInspeccion() {
    if (this.rolActual !== 'admin') return;

    if (!this.inspeccionActual.idVehiculo || !this.inspeccionActual.idCliente || !this.inspeccionActual.cantidadCombustible) {
      return alert('Por favor, selecciona el Vehículo, el Cliente y el Nivel de Combustible.');
    }
    
    this.inspeccionService.crearInspeccion(this.inspeccionActual).subscribe({
      next: () => {
        alert('¡Inspección registrada con éxito en la base de datos!');
        this.inspeccionActual = this.resetForm(); 
      },
      error: (err) => {
        console.error('Error al guardar inspección', err);
        alert('Ocurrió un error al guardar. Revisa la consola.');
      }
    });
  }
}