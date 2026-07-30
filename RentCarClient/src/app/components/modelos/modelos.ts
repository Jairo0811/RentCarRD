import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModeloService } from '../../services/modelo.service';
import { MarcaService } from '../../services/marca.service';

export interface Modelo {
  id?: number;
  idMarca: number;
  descripcion: string;
  estado: boolean;
}

export interface Marca {
  id?: number;
  descripcion: string;
  estado: boolean;
}

@Component({
  selector: 'app-modelos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modelos.html',
  styleUrl: './modelos.css'
})
export class ModelosComponent implements OnInit {
  listaModelos: Modelo[] = [];
  listaMarcas: Marca[] = [];
  modeloActual: Modelo = this.crearModeloVacio();
  modoEdicion = false;

  constructor(
    private modeloService: ModeloService,
    private marcaService: MarcaService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.cargarModelos();
      this.cargarMarcas();
    }, 0);
  }

  crearModeloVacio(): Modelo {
    return {
      idMarca: 0,
      descripcion: '',
      estado: true
    };
  }

  cargarModelos(): void {
    this.modeloService.getModelos().subscribe({
      next: (data: Modelo[]) => {
        this.listaModelos = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar modelos', err);
        alert('No se pudieron cargar los modelos.');
      }
    });
  }

  cargarMarcas(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data: Marca[]) => {
        this.listaMarcas = data.filter(
          (marca: Marca) => marca.estado
        );
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar marcas', err);
        alert('No se pudieron cargar las marcas.');
      }
    });
  }

  guardarModelo(): void {
    const descripcion = this.modeloActual.descripcion?.trim();
    const idMarca = Number(this.modeloActual.idMarca);

    if (!descripcion || idMarca <= 0) {
      alert(
        'Por favor completa la descripción y selecciona una marca.'
      );
      return;
    }

    const existeDuplicado = this.listaModelos.some(
      (modelo: Modelo) =>
        modelo.descripcion.trim().toLowerCase() ===
          descripcion.toLowerCase() &&
        Number(modelo.idMarca) === idMarca &&
        Number(modelo.id) !== Number(this.modeloActual.id)
    );

    if (existeDuplicado) {
      alert(
        'Ya existe un modelo con esa descripción para la marca seleccionada.'
      );
      return;
    }

    const modeloEnviar: Modelo = {
      ...this.modeloActual,
      descripcion,
      idMarca
    };

    if (this.modoEdicion && modeloEnviar.id) {
      this.modeloService.actualizarModelo(modeloEnviar).subscribe({
        next: () => {
          alert('Modelo actualizado correctamente.');
          this.cancelarEdicion();
          this.cargarModelos();
        },
        error: (err: any) => {
          console.error('Error al actualizar el modelo', err);
          alert('No se pudo actualizar el modelo.');
        }
      });

      return;
    }

    this.modeloService.createModelo(modeloEnviar).subscribe({
      next: () => {
        alert('Modelo guardado con éxito.');
        this.cancelarEdicion();
        this.cargarModelos();
      },
      error: (err: any) => {
        console.error('Error al guardar el modelo', err);
        alert('No se pudo guardar el modelo.');
      }
    });
  }

  editarModelo(modelo: Modelo): void {
    this.modeloActual = { ...modelo };
    this.modoEdicion = true;
    this.cdr.detectChanges();
  }

  cancelarEdicion(): void {
    this.modeloActual = this.crearModeloVacio();
    this.modoEdicion = false;
    this.cdr.detectChanges();
  }

  eliminarModelo(id: number | undefined): void {
    if (!id) {
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este modelo?')) {
      return;
    }

    this.modeloService.deleteModelo(id).subscribe({
      next: () => {
        this.cargarModelos();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al eliminar', err);
        alert(
          'No se pudo eliminar el modelo. Puede estar relacionado con un vehículo.'
        );
      }
    });
  }

  obtenerNombreMarca(idMarca: number): string {
    const marca = this.listaMarcas.find(
      (item: Marca) => Number(item.id) === Number(idMarca)
    );

    return marca ? marca.descripcion : 'N/A';
  }
}
