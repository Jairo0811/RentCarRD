import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; 
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VehiculoService } from '../../services/vehiculo.service';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.css',
})
export class Vehiculos implements OnInit {
  vehiculos: any[] = [];
  mostrarFormulario = false;

  nuevoVehiculo: any = {
    descripcion: '', marca: '', modelo: '', tipoVehiculo: '',
    noPlaca: '', noChasis: '', noMotor: '', tipoCombustible: '', estado: true
  };

  constructor(
    private vehiculoService: VehiculoService,
    private cdr: ChangeDetectorRef
  ) { }

  // Escudo aplicado aquí
  get rolActual(): string | null {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('rolUsuario');
    }
    return null;
  }

  ngOnInit(): void {
    this.cargarVehiculos();
  }

  cargarVehiculos() {
    this.vehiculoService.getVehiculos().subscribe({
      next: (data) => {
        this.vehiculos = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar vehículos", err)
    });
  }

  guardarVehiculo() {
    if (!this.nuevoVehiculo.descripcion || !this.nuevoVehiculo.noPlaca) {
      alert("Por favor, completa al menos la descripción y la placa.");
      return;
    }

    this.vehiculoService.crearVehiculo(this.nuevoVehiculo).subscribe({
      next: () => {
        alert('¡Vehículo guardado con éxito!');

        this.nuevoVehiculo = {
          descripcion: '', marca: '', modelo: '', tipoVehiculo: '',
          noPlaca: '', noChasis: '', noMotor: '', tipoCombustible: '', estado: true
        };

        this.mostrarFormulario = false;
        this.cargarVehiculos();
      },
      error: (err) => {
        console.error('Error al guardar:', err);
        alert('Error al guardar. Revisa la conexión.');
      }
    });
  }
}