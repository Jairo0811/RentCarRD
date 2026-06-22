import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { TipoVehiculoService } from '../../services/tipo-vehiculo.service';

export interface TipoVehiculo {
  id?: number;
  descripcion: string;
  estado: boolean;
}

@Component({
  selector: 'app-tipos-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipos-vehiculos.html',
  styleUrls: ['./tipos-vehiculos.css']
})
export class TiposVehiculosComponent implements OnInit {
  listaTipos: TipoVehiculo[] = [];
  tipoActual: TipoVehiculo = { descripcion: '', estado: true };

  constructor(private srv: TipoVehiculoService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargarDatos(); }

  cargarDatos(): void {
    this.srv.getTipos().subscribe({
      next: (data) => { this.listaTipos = data; this.cdr.detectChanges(); },
      error: (err) => console.error(err)
    });
  }

  guardar(): void {
    if (!this.tipoActual.descripcion) return alert('Completa la descripción.');
    this.srv.crearTipo(this.tipoActual).subscribe({
      next: () => { alert('Guardado'); this.cargarDatos(); this.tipoActual.descripcion = ''; },
      error: (err) => console.error(err)
    });
  }

  eliminar(id: number | undefined): void {
    if (id && confirm('¿Eliminar?')) {
      this.srv.deleteTipo(id).subscribe(() => this.cargarDatos());
    }
  }
}