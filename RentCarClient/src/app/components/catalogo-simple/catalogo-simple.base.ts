import { ChangeDetectorRef, Directive, OnInit, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Catalogo } from '../../interfaces/modelos';
import { CatalogoCrud } from '../../services/catalogo.service';
import { AuthService } from '../../services/auth.service';
import { confirmar, mensajeError, notificar } from '../../shared/alertas';

/**
 * Lógica común de los catálogos simples (marcas, tipos de vehículo y de combustible).
 * Como en v1.2, Admin y Empleado consultan y gestionan los catálogos; la API exige un
 * usuario autenticado y activo y bloquea la eliminación de registros en uso (409).
 */
@Directive()
export abstract class CatalogoSimpleBase implements OnInit {
  abstract readonly titulo: string;
  abstract readonly etiqueta: string;
  abstract readonly ejemplo: string;
  protected abstract readonly api: CatalogoCrud;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly auth = inject(AuthService);
  /** Ambos roles operativos pueden gestionar catálogos (permisos de v1.2). */
  readonly puedeEditar = computed(() => this.auth.rol() === 'admin' || this.auth.rol() === 'empleado');

  items: Catalogo[] = [];
  actual: Catalogo = this.vacio();
  modoEdicion = false;
  cargando = true;
  guardando = false;
  errorCarga = '';
  readonly idCampo = `descripcion-${Math.random().toString(36).slice(2, 8)}`;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.errorCarga = '';
    this.api.listar().subscribe({
      next: (datos) => {
        this.items = [...datos];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorCarga = mensajeError(error, `No se pudieron cargar los registros de ${this.titulo.toLowerCase()}.`);
        this.cdr.markForCheck();
      },
    });
  }

  guardar(): void {
    const descripcion = this.actual.descripcion?.trim() ?? '';
    if (!descripcion) {
      void notificar('La descripción es obligatoria.', 'warning');
      return;
    }

    const duplicada = this.items.some(
      (item) => item.descripcion?.trim().toLowerCase() === descripcion.toLowerCase() && item.id !== this.actual.id,
    );
    if (duplicada) {
      void notificar('Ya existe un registro con esa descripción.', 'warning');
      return;
    }

    if (this.guardando) return;
    this.guardando = true;
    const item: Catalogo = { ...this.actual, descripcion };
    const operacion: Observable<unknown> = this.modoEdicion && item.id ? this.api.actualizar(item) : this.api.crear(item);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        void notificar(this.modoEdicion ? 'Registro actualizado correctamente.' : 'Registro guardado correctamente.', 'success');
        this.cancelar();
        this.cargar();
      },
      error: (error: unknown) => {
        this.guardando = false;
        void notificar(mensajeError(error, 'No se pudo guardar el registro.'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  editar(item: Catalogo): void {
    this.actual = { ...item };
    this.modoEdicion = true;
  }

  cancelar(): void {
    this.actual = this.vacio();
    this.modoEdicion = false;
    this.cdr.markForCheck();
  }

  async eliminar(item: Catalogo): Promise<void> {
    if (!item.id) return;
    const confirmado = await confirmar(`Se eliminará "${item.descripcion}". Esta acción no se puede deshacer.`, {
      titulo: '¿Eliminar registro?',
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.api.eliminar(item.id).subscribe({
      next: () => {
        void notificar('Registro eliminado correctamente.', 'success');
        this.cargar();
      },
      error: (error: unknown) => void notificar(mensajeError(error, 'No se pudo eliminar el registro.'), 'error'),
    });
  }

  private vacio(): Catalogo {
    return { descripcion: '', estado: true };
  }
}
