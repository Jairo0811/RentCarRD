import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { Catalogo, Modelo } from '../../interfaces/modelos';
import { MarcaService } from '../../services/marca.service';
import { ModeloService } from '../../services/modelo.service';
import { confirmar, mensajeError, notificar } from '../../shared/alertas';

/**
 * Modelos de vehículo vinculados a una marca.
 * Admin y Empleado los gestionan (permisos de v1.2); la API valida que la marca exista,
 * que la descripción no se repita dentro de la marca y que no se elimine un modelo en uso.
 */
@Component({
  selector: 'app-modelos',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './modelos.html',
  styleUrl: './modelos.css',
})
export class ModelosComponent implements OnInit {
  private readonly modeloService = inject(ModeloService);
  private readonly marcaService = inject(MarcaService);
  private readonly cdr = inject(ChangeDetectorRef);

  listaModelos: Modelo[] = [];
  listaMarcas: Catalogo[] = [];
  modeloActual: Modelo = this.crearModeloVacio();
  modoEdicion = false;
  cargando = true;
  guardando = false;
  errorCarga = '';

  ngOnInit(): void {
    this.cargar();
  }

  /** Marcas activas para el selector (al editar se conserva la marca actual aunque esté inactiva). */
  get marcasSeleccionables(): Catalogo[] {
    return this.listaMarcas.filter((marca) => marca.estado || marca.id === this.modeloActual.idMarca);
  }

  cargar(): void {
    this.cargando = true;
    this.errorCarga = '';
    forkJoin({ modelos: this.modeloService.getModelos(), marcas: this.marcaService.getMarcas() }).subscribe({
      next: ({ modelos, marcas }) => {
        this.listaModelos = [...modelos];
        this.listaMarcas = [...marcas];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorCarga = mensajeError(error, 'No se pudieron cargar los modelos.');
        this.cdr.markForCheck();
      },
    });
  }

  crearModeloVacio(): Modelo {
    return { idMarca: null, descripcion: '', estado: true };
  }

  guardarModelo(): void {
    const descripcion = this.modeloActual.descripcion?.trim() ?? '';
    const idMarca = Number(this.modeloActual.idMarca);

    if (!descripcion || !Number.isInteger(idMarca) || idMarca <= 0) {
      void notificar('Completa la descripción y selecciona una marca.', 'warning');
      return;
    }

    const existeDuplicado = this.listaModelos.some(
      (modelo) =>
        modelo.descripcion?.trim().toLowerCase() === descripcion.toLowerCase() &&
        Number(modelo.idMarca) === idMarca &&
        modelo.id !== this.modeloActual.id,
    );
    if (existeDuplicado) {
      void notificar('Ya existe un modelo con esa descripción para la marca seleccionada.', 'warning');
      return;
    }

    if (this.guardando) return;
    this.guardando = true;

    const modelo: Modelo = { ...this.modeloActual, descripcion, idMarca };
    const editando = this.modoEdicion && !!modelo.id;
    const operacion: Observable<unknown> = editando ? this.modeloService.actualizarModelo(modelo) : this.modeloService.crearModelo(modelo);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        void notificar(editando ? 'Modelo actualizado correctamente.' : 'Modelo guardado correctamente.', 'success');
        this.cancelarEdicion();
        this.cargar();
      },
      error: (error: unknown) => {
        this.guardando = false;
        void notificar(mensajeError(error, 'No se pudo guardar el modelo.'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  editarModelo(modelo: Modelo): void {
    this.modeloActual = { ...modelo };
    this.modoEdicion = true;
  }

  cancelarEdicion(): void {
    this.modeloActual = this.crearModeloVacio();
    this.modoEdicion = false;
    this.cdr.markForCheck();
  }

  async eliminarModelo(modelo: Modelo): Promise<void> {
    if (!modelo.id) return;

    const confirmado = await confirmar(`Se eliminará el modelo "${modelo.descripcion}". Esta acción no se puede deshacer.`, {
      titulo: '¿Eliminar modelo?',
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.modeloService.eliminarModelo(modelo.id).subscribe({
      next: () => {
        void notificar('Modelo eliminado correctamente.', 'success');
        this.cargar();
      },
      error: (error: unknown) =>
        void notificar(mensajeError(error, 'No se pudo eliminar el modelo. Puede estar relacionado con un vehículo.'), 'error'),
    });
  }

  obtenerNombreMarca(idMarca: number | null): string {
    return this.listaMarcas.find((marca) => marca.id === Number(idMarca))?.descripcion ?? 'N/A';
  }
}
