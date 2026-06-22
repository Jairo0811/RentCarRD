import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { ModeloService } from '../../services/modelo.service';
import { MarcaService } from '../../services/marca.service';
import { Modelo } from '../../interfaces/modelo';
import { Marca } from '../../interfaces/marca';

@Component({
  selector: 'app-modelos',
  standalone: true, 
  imports: [CommonModule, FormsModule], 
  templateUrl: './modelos.html',
  styleUrls: ['./modelos.css']
})
export class ModelosComponent implements OnInit {
  
  listaModelos: Modelo[] = [];
  listaMarcas: Marca[] = [];
  
  // Molde vacío para el formulario
  modeloActual: Modelo = {
    descripcion: '',
    idMarca: 0,
    estado: true
  };

  constructor(
    private modeloService: ModeloService,
    private marcaService: MarcaService
  ) {}

  ngOnInit(): void {
    this.cargarModelos();
    this.cargarMarcas();
  }

  cargarModelos(): void {
    this.modeloService.getModelos().subscribe({
      next: (data) => {
        this.listaModelos = data;
        // Eliminamos el detectChanges() forzado.
      },
      error: (err) => console.error('Error al cargar modelos', err)
    });
  }

  cargarMarcas(): void {
    // Esto llena el menú desplegable (Select) del formulario
    this.marcaService.getMarcas().subscribe({
      next: (data) => this.listaMarcas = data,
      error: (err) => console.error('Error al cargar marcas', err)
    });
  }

  guardarModelo(): void {
    // Validación rápida
    if (!this.modeloActual.descripcion || this.modeloActual.idMarca === 0) {
      alert('Por favor completa la descripción y selecciona una marca.');
      return;
    }

    this.modeloService.createModelo(this.modeloActual).subscribe({
      next: () => {
        alert('Modelo guardado con éxito');
        this.cargarModelos(); // Recarga la tabla
        this.modeloActual = { descripcion: '', idMarca: 0, estado: true }; // Limpia el formulario
      },
      error: (err) => console.error('Error al guardar', err)
    });
  }

  eliminarModelo(id: number | undefined): void {
    if (id && confirm('¿Estás seguro de eliminar este modelo?')) {
      this.modeloService.deleteModelo(id).subscribe({
        next: () => {
          this.cargarModelos();
        },
        error: (err) => console.error('Error al eliminar', err)
      });
    }
  }

  // Método auxiliar para mostrar el nombre de la marca en la tabla en vez del ID numérico
  obtenerNombreMarca(idMarca: number): string {
    const marca = this.listaMarcas.find(m => m.id === idMarca);
    return marca ? marca.descripcion : 'Desconocida';
  }
}