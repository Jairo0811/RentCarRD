import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { TipoCombustibleService } from '../../services/tipo-combustible.service';

export interface TipoCombustible {
  id?: number;
  descripcion: string;
  estado: boolean;
}

@Component({
  selector: 'app-tipos-combustibles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tipos-combustibles.html',
  styleUrls: ['./tipos-combustibles.css']
})
export class TiposCombustiblesComponent implements OnInit {
  listaCombustibles: TipoCombustible[] = [];
  combustibleActual: TipoCombustible = { descripcion: '', estado: true };

  constructor(private srv: TipoCombustibleService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.cargarDatos(); }

  cargarDatos(): void {
    this.srv.getCombustibles().subscribe({
      next: (data) => { this.listaCombustibles = data; this.cdr.detectChanges(); },
      error: (err) => console.error(err)
    });
  }

  guardar(): void {
    if (!this.combustibleActual.descripcion) return alert('Completa la descripción.');
    this.srv.crearCombustible(this.combustibleActual).subscribe({
      next: () => { alert('Guardado'); this.cargarDatos(); this.combustibleActual.descripcion = ''; },
      error: (err) => console.error(err)
    });
  }

  eliminar(id: number | undefined): void {
    if (id && confirm('¿Eliminar?')) {
      this.srv.deleteCombustible(id).subscribe(() => this.cargarDatos());
    }
  }
}