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

  modeloActual: Modelo = {
    idMarca: 0,
    descripcion: '',
    estado: true
  };

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

  cargarModelos(): void {
    this.modeloService.getModelos().subscribe({
      next: (data: Modelo[]) => {
        this.listaModelos = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar modelos', err);
      }
    });
  }

  cargarMarcas(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data: Marca[]) => {
        this.listaMarcas = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al cargar marcas', err);
      }
    });
  }

  guardarModelo(): void {
    if (!this.modeloActual.descripcion || Number(this.modeloActual.idMarca) === 0) {
      alert('Por favor completa la descripción y selecciona una marca.');
      return;
    }

    const modeloEnviar: Modelo = {
      ...this.modeloActual,
      idMarca: Number(this.modeloActual.idMarca),
      estado: true
    };

    this.modeloService.createModelo(modeloEnviar).subscribe({
      next: () => {
        alert('Modelo guardado con éxito');

        this.modeloActual = {
          idMarca: 0,
          descripcion: '',
          estado: true
        };

        this.cargarModelos();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error al guardar', err);
      }
    });
  }

  eliminarModelo(id: number | undefined): void {
    if (!id) return;

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
      }
    });
  }

  obtenerNombreMarca(idMarca: number): string {
    const marca = this.listaMarcas.find(m => Number(m.id) === Number(idMarca));
    return marca ? marca.descripcion : 'N/A';
  }
}