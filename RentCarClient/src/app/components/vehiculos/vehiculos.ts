import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { VehiculoService } from '../../services/vehiculo.service';
import { MarcaService } from '../../services/marca.service';
import { ModeloService } from '../../services/modelo.service';
import { TipoVehiculoService } from '../../services/tipo-vehiculo.service';
import { TipoCombustibleService } from '../../services/tipo-combustible.service';

@Component({
  selector: 'app-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vehiculos.html',
  styleUrl: './vehiculos.css',
})
export class Vehiculos implements OnInit {
  vehiculos: any[] = [];
  marcas: any[] = [];
  modelos: any[] = [];
  tiposVehiculos: any[] = [];
  tiposCombustibles: any[] = [];

  mostrarFormulario = false;
  modoEdicion = false;

  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;

  nuevoVehiculo: any = this.crearVehiculoVacio();

  constructor(
    private vehiculoService: VehiculoService,
    private marcaService: MarcaService,
    private modeloService: ModeloService,
    private tipoVehiculoService: TipoVehiculoService,
    private tipoCombustibleService: TipoCombustibleService,
    private cdr: ChangeDetectorRef
  ) { }

  get rolActual(): string | null {
    return localStorage.getItem('rolUsuario');
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.cargarCatalogos();
      this.cargarVehiculos();
    }, 0);
  }

  crearVehiculoVacio(): any {
    return {
      id: 0,
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
      imagenUrl: ''
    };
  }

  cargarCatalogos(): void {
    this.marcaService.getMarcas().subscribe({
      next: (data: any[]) => {
        this.marcas = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando marcas', err)
    });

    this.modeloService.getModelos().subscribe({
      next: (data: any[]) => {
        this.modelos = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando modelos', err)
    });

    this.tipoVehiculoService.getTipos().subscribe({
      next: (data: any[]) => {
        this.tiposVehiculos = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando tipos de vehículos', err)
    });

    this.tipoCombustibleService.getCombustibles().subscribe({
      next: (data: any[]) => {
        this.tiposCombustibles = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando combustibles', err)
    });
  }

  cargarVehiculos(): void {
    this.vehiculoService.getVehiculos().subscribe({
      next: (data: any[]) => {
        this.vehiculos = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar vehículos', err)
    });
  }

  get modelosFiltrados(): any[] {
    if (!this.nuevoVehiculo.idMarca) {
      return this.modelos;
    }

    return this.modelos.filter(m => Number(m.idMarca) === Number(this.nuevoVehiculo.idMarca));
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
    this.imagenSeleccionada = archivo;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagenPreview = reader.result as string;
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(archivo);
  }

  guardarVehiculo(): void {
    if (!this.nuevoVehiculo.descripcion || !this.nuevoVehiculo.noPlaca) {
      alert('Por favor, completa la descripción y la placa.');
      return;
    }

    if (
      !this.nuevoVehiculo.idMarca ||
      !this.nuevoVehiculo.idModelo ||
      !this.nuevoVehiculo.idTipoVehiculo ||
      !this.nuevoVehiculo.idTipoCombustible
    ) {
      alert('Selecciona marca, modelo, tipo de vehículo y combustible.');
      return;
    }

    const vehiculoEnviar = {
      ...this.nuevoVehiculo,
      idMarca: Number(this.nuevoVehiculo.idMarca),
      idModelo: Number(this.nuevoVehiculo.idModelo),
      idTipoVehiculo: Number(this.nuevoVehiculo.idTipoVehiculo),
      idTipoCombustible: Number(this.nuevoVehiculo.idTipoCombustible),
      idCombustible: Number(this.nuevoVehiculo.idTipoCombustible)
    };

    if (this.modoEdicion) {
      this.vehiculoService.actualizarVehiculo(vehiculoEnviar).subscribe({
        next: () => {
          if (this.imagenSeleccionada && vehiculoEnviar.id) {
            this.subirImagenVehiculo(vehiculoEnviar.id);
          } else {
            alert('Vehículo actualizado correctamente.');
            this.cancelar();
            this.cargarVehiculos();
          }
        },
        error: (err: any) => {
          console.error('Error al actualizar vehículo:', err);
          alert('Error al actualizar. Revisa la consola.');
        }
      });
    } else {
      this.vehiculoService.crearVehiculo(vehiculoEnviar).subscribe({
        next: (vehiculoCreado: any) => {
          const idVehiculo = vehiculoCreado.id;

          if (this.imagenSeleccionada && idVehiculo) {
            this.subirImagenVehiculo(idVehiculo);
          } else {
            alert('Vehículo guardado correctamente.');
            this.cancelar();
            this.cargarVehiculos();
          }
        },
        error: (err: any) => {
          console.error('Error al guardar vehículo:', err);
          alert('Error al guardar. Revisa la conexión.');
        }
      });
    }
  }

  subirImagenVehiculo(idVehiculo: number): void {
    if (!this.imagenSeleccionada) return;

    this.vehiculoService.subirImagen(idVehiculo, this.imagenSeleccionada).subscribe({
      next: () => {
        alert('Vehículo e imagen guardados correctamente.');
        this.cancelar();
        this.cargarVehiculos();
      },
      error: (err: any) => {
        console.error('Error al subir imagen:', err);
        alert('El vehículo se guardó, pero ocurrió un error al subir la imagen.');
        this.cancelar();
        this.cargarVehiculos();
      }
    });
  }

  editar(vehiculo: any): void {
    this.nuevoVehiculo = { ...vehiculo };

    if (!this.nuevoVehiculo.idTipoCombustible && this.nuevoVehiculo.idCombustible) {
      this.nuevoVehiculo.idTipoCombustible = this.nuevoVehiculo.idCombustible;
    }

    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.cdr.detectChanges();
  }

  eliminar(id?: number): void {
    if (!id) return;

    if (!confirm('¿Deseas eliminar este vehículo?')) return;

    this.vehiculoService.eliminarVehiculo(id).subscribe({
      next: () => {
        alert('Vehículo eliminado correctamente.');
        this.cargarVehiculos();
      },
      error: (err: any) => {
        console.error('Error al eliminar vehículo:', err);
        alert('No se pudo eliminar el vehículo. Puede estar relacionado con una renta o inspección.');
      }
    });
  }

  cancelar(): void {
    this.nuevoVehiculo = this.crearVehiculoVacio();
    this.imagenSeleccionada = null;
    this.imagenPreview = null;
    this.modoEdicion = false;
    this.mostrarFormulario = false;
    this.cdr.detectChanges();
  }

  obtenerMarca(idMarca: number): string {
    const marca = this.marcas.find(m => Number(m.id) === Number(idMarca));
    return marca ? marca.descripcion : 'N/A';
  }

  obtenerModelo(idModelo: number): string {
    const modelo = this.modelos.find(m => Number(m.id) === Number(idModelo));
    return modelo ? modelo.descripcion : 'N/A';
  }

  obtenerTipoVehiculo(idTipoVehiculo: number): string {
    const tipo = this.tiposVehiculos.find(t => Number(t.id) === Number(idTipoVehiculo));
    return tipo ? tipo.descripcion : 'N/A';
  }

  obtenerCombustible(vehiculo: any): string {
    const id = vehiculo.idTipoCombustible ?? vehiculo.idCombustible;
    const combustible = this.tiposCombustibles.find(c => Number(c.id) === Number(id));
    return combustible ? combustible.descripcion : 'N/A';
  }
}