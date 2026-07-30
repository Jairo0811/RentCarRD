import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarcaService } from '../../services/marca.service';

interface Marca {
  id?: number;
  descripcion: string;
  estado: boolean;
}

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marcas.html'
})
export class MarcasComponent implements OnInit {
  marcas: Marca[] = [];
  nuevaMarca: Marca = this.crearMarcaVacia();
  modoEdicion = false;

  constructor(
    private marcaService: MarcaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cargarMarcas();
  }

  crearMarcaVacia(): Marca {
    return {
      descripcion: '',
      estado: true
    };
  }

  cargarMarcas(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data: Marca[]) => {
        this.marcas = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar marcas', err);
        alert('No se pudieron cargar las marcas.');
      }
    });
  }

  guardarMarca(): void {
    const descripcion = this.nuevaMarca.descripcion?.trim();

    if (!descripcion) {
      alert('La descripción de la marca es obligatoria.');
      return;
    }

    const existeDuplicada = this.marcas.some(
      (marca: Marca) =>
        marca.descripcion.trim().toLowerCase() ===
          descripcion.toLowerCase() &&
        Number(marca.id) !== Number(this.nuevaMarca.id)
    );

    if (existeDuplicada) {
      alert('Ya existe una marca con esa descripción.');
      return;
    }

    const marcaEnviar: Marca = {
      ...this.nuevaMarca,
      descripcion
    };

    if (this.modoEdicion && marcaEnviar.id) {
      this.marcaService.actualizarMarca(marcaEnviar).subscribe({
        next: () => {
          alert('Marca actualizada correctamente.');
          this.cancelarEdicion();
          this.cargarMarcas();
        },
        error: (err: any) => {
          console.error('Error al actualizar la marca', err);
          alert('No se pudo actualizar la marca.');
        }
      });

      return;
    }

    this.marcaService.crearMarca(marcaEnviar).subscribe({
      next: () => {
        alert('Marca guardada correctamente.');
        this.cancelarEdicion();
        this.cargarMarcas();
      },
      error: (err: any) => {
        console.error('Error al guardar la marca', err);
        alert('No se pudo guardar la marca.');
      }
    });
  }

  editarMarca(marca: Marca): void {
    this.nuevaMarca = { ...marca };
    this.modoEdicion = true;
    this.cdr.detectChanges();
  }

  cancelarEdicion(): void {
    this.nuevaMarca = this.crearMarcaVacia();
    this.modoEdicion = false;
    this.cdr.detectChanges();
  }
}
