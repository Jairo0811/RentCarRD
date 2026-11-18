import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { VehiculoService } from '../../services/vehiculo.service';
import { MarcaService } from '../../services/marca.service';
import { ModeloService } from '../../services/modelo.service';
import { TipoVehiculoService } from '../../services/tipo-vehiculo.service';
import { TipoCombustibleService } from '../../services/tipo-combustible.service';
import { environment } from '../../../environments/environment';
import { confirmar, mensajeError, notificar } from '../../shared/alertas';
import { AuthService } from '../../services/auth.service';
import { Catalogo, EstadoVehiculo, Modelo, Vehiculo, estadoOperativo } from '../../interfaces/modelos';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.css',
})
export class Vehiculos implements OnInit {
  readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly auth = inject(AuthService);

  vehiculos: Vehiculo[] = [];
  marcas: Catalogo[] = [];
  modelos: Modelo[] = [];
  tiposVehiculos: Catalogo[] = [];
  tiposCombustibles: Catalogo[] = [];
  guardando = false;
  cargando = true;

  mostrarFormulario = false;
  modoEdicion = false;

  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;

  terminoBusqueda = '';
  filtroEstado = 'todos';

  nuevoVehiculo: Vehiculo = this.crearVehiculoVacio();

  constructor(
    private vehiculoService: VehiculoService,
    private marcaService: MarcaService,
    private modeloService: ModeloService,
    private tipoVehiculoService: TipoVehiculoService,
    private tipoCombustibleService: TipoCombustibleService,
    private cdr: ChangeDetectorRef
  ) {}

  /** Rol tomado del JWT de la sesión (la API aplica la autorización real). */
  get rolActual(): string | null {
    return this.auth.rol();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.cargarCatalogos();
      this.cargarVehiculos();
    }, 0);
  }

  crearVehiculoVacio(): Vehiculo {
    return {
      descripcion: '',
      noPlaca: '',
      noChasis: '',
      noMotor: '',
      idMarca: null,
      idModelo: null,
      idTipoVehiculo: null,
      idTipoCombustible: null,
      idCombustible: null,
      estado: true,
      estadoOperacion: 'Disponible',
      imagenUrl: null
    };
  }

  cargarCatalogos(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data) => {
        this.marcas = [...data];
        this.cdr.markForCheck();
      },
      error: (err: unknown) => void notificar(mensajeError(err, 'No se pudieron cargar las marcas.'), 'error')
    });

    this.modeloService.getModelos().subscribe({
      next: (data) => {
        this.modelos = [...data];
        this.cdr.markForCheck();
      },
      error: (err: unknown) => void notificar(mensajeError(err, 'No se pudieron cargar los modelos.'), 'error')
    });

    this.tipoVehiculoService.getTipos().subscribe({
      next: (data) => {
        this.tiposVehiculos = [...data];
        this.cdr.markForCheck();
      },
      error: (err: unknown) => void notificar(mensajeError(err, 'No se pudieron cargar los tipos de vehículo.'), 'error')
    });

    this.tipoCombustibleService.getCombustibles().subscribe({
      next: (data) => {
        this.tiposCombustibles = [...data];
        this.cdr.markForCheck();
      },
      error: (err: unknown) => void notificar(mensajeError(err, 'No se pudieron cargar los tipos de combustible.'), 'error')
    });
  }

  cargarVehiculos(): void {
    this.vehiculoService.getVehiculos().subscribe({
      next: (data) => {
        this.vehiculos = [...data];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.cargando = false;
        void notificar(mensajeError(err, 'No se pudieron cargar los vehículos.'), 'error');
        this.cdr.markForCheck();
      }
    });
  }

  get vehiculosFiltrados(): Vehiculo[] {
    const termino = this.normalizarTexto(this.terminoBusqueda);

    return this.vehiculos.filter((vehiculo) => {
      const coincideEstado = this.coincideConEstado(vehiculo);

      if (!coincideEstado) {
        return false;
      }

      if (!termino) {
        return true;
      }

      const marca = this.obtenerMarca(vehiculo.idMarca);
      const modelo = this.obtenerModelo(vehiculo.idModelo);
      const tipo = this.obtenerTipoVehiculo(vehiculo.idTipoVehiculo);
      const combustible = this.obtenerCombustible(vehiculo);
      const estado = this.obtenerEstadoOperacion(vehiculo);

      const contenidoBuscable = [
        vehiculo.descripcion,
        vehiculo.noPlaca,
        vehiculo.noChasis,
        vehiculo.noMotor,
        marca,
        modelo,
        tipo,
        combustible,
        estado
      ]
        .map((valor) => this.normalizarTexto(valor))
        .join(' ');

      return contenidoBuscable.includes(termino);
    });
  }

  get cantidadDisponibles(): number {
    return this.vehiculos.filter(
      (vehiculo) => this.obtenerEstadoOperacion(vehiculo) === 'Disponible'
    ).length;
  }

  get cantidadRentados(): number {
    return this.vehiculos.filter(
      (vehiculo) => this.obtenerEstadoOperacion(vehiculo) === 'Rentado'
    ).length;
  }

  get cantidadNoDisponibles(): number {
    return this.vehiculos.filter(
      (vehiculo) => this.obtenerEstadoOperacion(vehiculo) === 'NoDisponible'
    ).length;
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.filtroEstado = 'todos';
  }

  private coincideConEstado(vehiculo: Vehiculo): boolean {
    switch (this.filtroEstado) {
      case 'disponibles':
        return this.obtenerEstadoOperacion(vehiculo) === 'Disponible';
      case 'rentados':
        return this.obtenerEstadoOperacion(vehiculo) === 'Rentado';
      case 'no-disponibles':
        return this.obtenerEstadoOperacion(vehiculo) === 'NoDisponible';
      default:
        return true;
    }
  }

  private normalizarTexto(valor: unknown): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  obtenerEstadoOperacion(vehiculo: Vehiculo): EstadoVehiculo {
    return estadoOperativo(vehiculo);
  }

  obtenerTextoEstado(vehiculo: Vehiculo): string {
    const estado = this.obtenerEstadoOperacion(vehiculo);
    return estado === 'NoDisponible' ? 'No disponible' : estado;
  }

  obtenerClaseEstado(vehiculo: Vehiculo): string {
    const estado = this.obtenerEstadoOperacion(vehiculo);

    switch (estado) {
      case 'Disponible':
        return 'bg-success';
      case 'Rentado':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  onPlacaInput(): void {
    this.nuevoVehiculo.noPlaca = this.limpiarAlfanumerico(this.nuevoVehiculo.noPlaca, 7);
  }

  onChasisInput(): void {
    this.nuevoVehiculo.noChasis = this.limpiarAlfanumerico(this.nuevoVehiculo.noChasis, 17);
  }

  onMotorInput(): void {
    this.nuevoVehiculo.noMotor = this.limpiarAlfanumerico(this.nuevoVehiculo.noMotor, 50);
  }

  private limpiarAlfanumerico(valor: string | null | undefined, maximo: number): string {
    return String(valor ?? '')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, maximo);
  }

  get modelosFiltrados(): Modelo[] {
    if (!this.nuevoVehiculo.idMarca) {
      return this.modelos;
    }

    return this.modelos.filter(
      (modelo) => Number(modelo.idMarca) === Number(this.nuevoVehiculo.idMarca)
    );
  }

  cambiarMarca(): void {
    this.nuevoVehiculo.idModelo = null;
  }

  seleccionarImagen(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.imagenSeleccionada = null;
      this.imagenPreview = null;
      return;
    }

    const archivo = input.files[0];
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
    const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.webp'];
    const nombreArchivo = archivo.name.toLowerCase();
    const extensionValida = extensionesPermitidas.some(extension => nombreArchivo.endsWith(extension));

    if (!tiposPermitidos.includes(archivo.type) || !extensionValida) {
      void notificar('Formato de imagen no permitido. Utiliza JPG, JPEG, PNG o WEBP.', 'warning');
      input.value = '';
      this.imagenSeleccionada = null;
      this.imagenPreview = null;
      return;
    }

    const tamanoMaximo = 5 * 1024 * 1024;
    if (archivo.size > tamanoMaximo) {
      void notificar('La imagen no puede superar los 5 MB.', 'warning');
      input.value = '';
      this.imagenSeleccionada = null;
      this.imagenPreview = null;
      return;
    }

    this.imagenSeleccionada = archivo;
    const reader = new FileReader();

    reader.onload = () => {
      this.imagenPreview = reader.result as string;
      this.cdr.markForCheck();
    };

    reader.onerror = () => {
      notificar('No fue posible leer la imagen seleccionada.');
      input.value = '';
      this.imagenSeleccionada = null;
      this.imagenPreview = null;
    };

    reader.readAsDataURL(archivo);
  }

  guardarVehiculo(): void {
    if (this.guardando) return;
    if (!this.nuevoVehiculo.descripcion?.trim() || !this.nuevoVehiculo.noPlaca) {
      void notificar('Completa la descripción y la placa.', 'warning');
      return;
    }

    this.onPlacaInput();
    this.onChasisInput();
    this.onMotorInput();

    if (!/^[A-Z0-9]{6,7}$/.test(this.nuevoVehiculo.noPlaca)) {
      void notificar('La placa debe contener entre 6 y 7 caracteres alfanuméricos.', 'warning');
      return;
    }

    if (this.nuevoVehiculo.noChasis && !/^[A-Z0-9]{1,17}$/.test(this.nuevoVehiculo.noChasis)) {
      void notificar('El chasis solo puede contener letras y números y debe tener un máximo de 17 caracteres.', 'warning');
      return;
    }

    if (!this.nuevoVehiculo.idMarca || !this.nuevoVehiculo.idModelo || !this.nuevoVehiculo.idTipoVehiculo || !this.nuevoVehiculo.idTipoCombustible) {
      void notificar('Selecciona marca, modelo, tipo de vehículo y combustible.', 'warning');
      return;
    }

    const vehiculoEnviar: Vehiculo = {
      ...this.nuevoVehiculo,
      descripcion: this.nuevoVehiculo.descripcion.trim(),
      idMarca: Number(this.nuevoVehiculo.idMarca),
      idModelo: Number(this.nuevoVehiculo.idModelo),
      idTipoVehiculo: Number(this.nuevoVehiculo.idTipoVehiculo),
      idTipoCombustible: Number(this.nuevoVehiculo.idTipoCombustible),
      estadoOperacion: this.obtenerEstadoOperacion(this.nuevoVehiculo),
    };

    this.guardando = true;
    const editando = this.modoEdicion && !!vehiculoEnviar.id;
    const operacion: Observable<Vehiculo | void> = editando
      ? this.vehiculoService.actualizarVehiculo(vehiculoEnviar)
      : this.vehiculoService.crearVehiculo(vehiculoEnviar);

    operacion.subscribe({
      next: (creado) => {
        const idVehiculo = editando ? vehiculoEnviar.id : (creado as Vehiculo | undefined)?.id;
        if (this.imagenSeleccionada && idVehiculo) {
          this.subirImagenVehiculo(idVehiculo);
          return;
        }
        this.guardando = false;
        void notificar(editando ? 'Vehículo actualizado correctamente.' : 'Vehículo guardado correctamente.', 'success');
        this.cancelar();
        this.cargarVehiculos();
      },
      error: (err: unknown) => {
        this.guardando = false;
        void notificar(mensajeError(err, editando ? 'No se pudo actualizar el vehículo.' : 'No se pudo guardar el vehículo.'), 'error');
        this.cdr.markForCheck();
      }
    });
  }

  subirImagenVehiculo(idVehiculo: number): void {
    if (!this.imagenSeleccionada) {
      this.guardando = false;
      return;
    }

    this.vehiculoService.subirImagen(idVehiculo, this.imagenSeleccionada).subscribe({
      next: () => {
        this.guardando = false;
        void notificar('Vehículo e imagen guardados correctamente.', 'success');
        this.cancelar();
        this.cargarVehiculos();
      },
      error: (err: unknown) => {
        this.guardando = false;
        void notificar(mensajeError(err, 'El vehículo se guardó, pero no fue posible subir la imagen.'), 'error');
        this.imagenSeleccionada = null;
        this.imagenPreview = null;
        this.cargarVehiculos();
        this.cdr.markForCheck();
      }
    });
  }

  editar(vehiculo: Vehiculo): void {
    this.nuevoVehiculo = { ...vehiculo };

    if (!this.nuevoVehiculo.idTipoCombustible && this.nuevoVehiculo.idCombustible) {
      this.nuevoVehiculo.idTipoCombustible = this.nuevoVehiculo.idCombustible;
    }

    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.imagenSeleccionada = null;
    this.imagenPreview = null;

    window.scrollTo({ top: 0 });
    this.cdr.markForCheck();
  }

  async eliminar(vehiculo: Vehiculo): Promise<void> {
    if (!vehiculo.id) return;
    const confirmado = await confirmar(`Se eliminará el vehículo "${vehiculo.descripcion}" (placa ${vehiculo.noPlaca}). Esta acción no se puede deshacer.`, {
      titulo: '¿Eliminar vehículo?',
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.vehiculoService.eliminarVehiculo(vehiculo.id).subscribe({
      next: () => {
        void notificar('Vehículo eliminado correctamente.', 'success');
        this.cargarVehiculos();
      },
      error: (err: unknown) =>
        void notificar(mensajeError(err, 'No se pudo eliminar el vehículo. Puede estar relacionado con una renta o inspección.'), 'error')
    });
  }

  cancelar(): void {
    this.nuevoVehiculo = this.crearVehiculoVacio();
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.modoEdicion = false;
    this.mostrarFormulario = false;
    this.guardando = false;
    this.cdr.markForCheck();
  }

  obtenerMarca(idMarca: number | null): string {
    const marca = this.marcas.find((item) => Number(item.id) === Number(idMarca));
    return marca ? marca.descripcion : 'N/A';
  }

  obtenerModelo(idModelo: number | null): string {
    const modelo = this.modelos.find((item) => Number(item.id) === Number(idModelo));
    return modelo ? modelo.descripcion : 'N/A';
  }

  obtenerTipoVehiculo(idTipoVehiculo: number | null): string {
    const tipo = this.tiposVehiculos.find((item) => Number(item.id) === Number(idTipoVehiculo));
    return tipo ? tipo.descripcion : 'N/A';
  }

  obtenerCombustible(vehiculo: Vehiculo): string {
    const id = vehiculo.idTipoCombustible ?? vehiculo.idCombustible;
    const combustible = this.tiposCombustibles.find((item) => Number(item.id) === Number(id));
    return combustible ? combustible.descripcion : 'N/A';
  }
}
