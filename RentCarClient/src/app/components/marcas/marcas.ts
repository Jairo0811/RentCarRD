import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarcaService } from '../../services/marca.service'; // Asegúrate de tener este servicio

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './marcas.html'
})
export class MarcasComponent implements OnInit {
  marcas: any[] = [];
  nuevaMarca: any = { descripcion: '', estado: true };

  constructor(private marcaService: MarcaService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarMarcas();
  }

  cargarMarcas() {
    this.marcaService.getMarcas().subscribe(data => {
      this.marcas = data;
      this.cdr.detectChanges();
    });
  }

  guardarMarca() {
    if (!this.nuevaMarca.descripcion) return alert("Descripción requerida");
    this.marcaService.crearMarca(this.nuevaMarca).subscribe(() => {
      this.nuevaMarca = { descripcion: '', estado: true };
      this.cargarMarcas();
    });
  }
}