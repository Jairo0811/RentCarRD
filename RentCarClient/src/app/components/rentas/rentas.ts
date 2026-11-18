import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Catalogo, Cliente, Modelo, Renta, Vehiculo, estadoOperativo } from '../../interfaces/modelos';
import { ClienteService } from '../../services/cliente.service';
import { MarcaService } from '../../services/marca.service';
import { ModeloService } from '../../services/modelo.service';
import { RentaService } from '../../services/renta.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { confirmar, mensajeError, notificar } from '../../shared/alertas';
import { cargarLogoBase64, generarContratoPdf, nombreArchivoContrato } from '../../shared/contrato-pdf';
import { fechaLocalISO, formatearFecha } from '../../shared/fechas';
import { Desglose, calcularDesglose, desgloseRenta } from '../../shared/montos';

export interface FormularioRenta {
  idVehiculo: number | null;
  idCliente: number | null;
  fechaRenta: string;
  montoXDia: number | null;
  cantidadDias: number | null;
  comentario: string;
}

export const DIAS_MAXIMOS = 365;
export const TARIFA_MAXIMA = 1_000_000;

/**
 * Rentas y devoluciones (Admin y Empleado).
 *
 * - Solo consulta endpoints permitidos a ambos roles: rentas, vehículos, clientes, marcas y
 *   modelos. El nombre del empleado responsable llega en cada renta (`nombreEmpleado`), por lo
 *   que no se consulta el listado administrativo de empleados (403 para Empleado).
 * - No envía `idEmpleado`: la API atribuye la renta al empleado autenticado (JWT).
 * - Los importes mostrados en el formulario son una vista previa con la misma fórmula que el
 *   servidor; los valores definitivos son los que devuelve la API.
 */
@Component({
  selector: 'app-rentas',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './rentas.html',
  styleUrl: './rentas.css',
})
export class Rentas implements OnInit {
  private readonly rentaService = inject(RentaService);
  private readonly vehiculoService = inject(VehiculoService);
  private readonly clienteService = inject(ClienteService);
  private readonly marcaService = inject(MarcaService);
  private readonly modeloService = inject(ModeloService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly diasMaximos = DIAS_MAXIMOS;

  rentas: Renta[] = [];
  vehiculos: Vehiculo[] = [];
  vehiculosDisponibles: Vehiculo[] = [];
  clientes: Cliente[] = [];
  clientesActivos: Cliente[] = [];
  marcas: Catalogo[] = [];
  modelos: Modelo[] = [];

  mostrarFormulario = false;
  cargando = true;
  errorCarga = '';
  guardando = false;
  /** Rentas con una devolución o un PDF en curso (evita doble procesamiento por doble clic). */
  readonly procesando = new Set<number>();

  nuevaRenta: FormularioRenta = this.crearRentaVacia();

  ngOnInit(): void {
    this.cargarDatos();
  }

  crearRentaVacia(): FormularioRenta {
    return {
      idVehiculo: null,
      idCliente: null,
      fechaRenta: fechaLocalISO(),
      montoXDia: null,
      cantidadDias: 1,
      comentario: '',
    };
  }

  cargarDatos(): void {
    this.cargando = true;
    this.errorCarga = '';
    forkJoin({
      rentas: this.rentaService.getRentas(),
      vehiculos: this.vehiculoService.getVehiculos(),
      clientes: this.clienteService.getClientes(),
      marcas: this.marcaService.getMarcas(),
      modelos: this.modeloService.getModelos(),
    }).subscribe({
      next: ({ rentas, vehiculos, clientes, marcas, modelos }) => {
        this.rentas = [...rentas];
        this.vehiculos = [...vehiculos];
        this.clientes = [...clientes];
        this.clientesActivos = clientes.filter((cliente) => cliente.estado);
        this.marcas = [...marcas];
        this.modelos = [...modelos];

        // Regla académica: un vehículo que ya tuvo una renta no vuelve a ofrecerse.
        const vehiculosConRenta = new Set(rentas.map((renta) => renta.idVehiculo));
        this.vehiculosDisponibles = vehiculos.filter(
          (vehiculo) => estadoOperativo(vehiculo) === 'Disponible' && !vehiculosConRenta.has(Number(vehiculo.id)),
        );

        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorCarga = mensajeError(error, 'No se pudieron cargar los datos de rentas.');
        this.cdr.markForCheck();
      },
    });
  }

  abrirFormulario(): void {
    this.nuevaRenta = this.crearRentaVacia();
    this.mostrarFormulario = true;
  }

  /** Devuelve el mensaje de validación o null si la renta puede enviarse. */
  validarFormulario(): string | null {
    const { idVehiculo, idCliente, montoXDia, cantidadDias, fechaRenta } = this.nuevaRenta;
    if (!idVehiculo || !idCliente) return 'Selecciona un vehículo y un cliente válidos.';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaRenta ?? '')) return 'Indica una fecha de renta válida.';

    const monto = Number(montoXDia);
    const dias = Number(cantidadDias);
    if (!Number.isFinite(monto) || monto <= 0 || monto > TARIFA_MAXIMA) {
      return 'La tarifa por día debe ser mayor que cero y no superar RD$ 1,000,000.';
    }
    if (!Number.isInteger(dias) || dias < 1 || dias > DIAS_MAXIMOS) {
      return `La cantidad de días debe ser un número entero entre 1 y ${DIAS_MAXIMOS}.`;
    }
    if ((this.nuevaRenta.comentario ?? '').length > 1000) return 'El comentario no puede superar 1000 caracteres.';

    if (!this.vehiculosDisponibles.some((vehiculo) => vehiculo.id === idVehiculo)) {
      return 'El vehículo seleccionado ya no está disponible para renta.';
    }
    return null;
  }

  guardarRenta(): void {
    if (this.guardando) return;

    const error = this.validarFormulario();
    if (error) {
      void notificar(error, 'warning');
      return;
    }

    this.guardando = true;
    this.rentaService
      .crearRenta({
        idVehiculo: Number(this.nuevaRenta.idVehiculo),
        idCliente: Number(this.nuevaRenta.idCliente),
        fechaRenta: this.nuevaRenta.fechaRenta,
        montoXDia: Number(this.nuevaRenta.montoXDia),
        cantidadDias: Number(this.nuevaRenta.cantidadDias),
        comentario: this.nuevaRenta.comentario?.trim() ?? '',
      })
      .subscribe({
        next: (renta) => {
          this.guardando = false;
          void notificar(`Renta #${renta.noRenta} registrada correctamente.`, 'success');
          this.cancelarFormulario();
          this.cargarDatos();
        },
        error: (err: unknown) => {
          this.guardando = false;
          void notificar(mensajeError(err, 'Ocurrió un error al registrar la renta.'), 'error');
          // Otro usuario pudo haber rentado el vehículo: se refresca la disponibilidad.
          this.cargarDatos();
        },
      });
  }

  async devolverVehiculo(renta: Renta): Promise<void> {
    if (renta.estado === 'Concluida') {
      void notificar('Esta renta ya fue concluida.', 'info');
      return;
    }
    if (this.procesando.has(renta.noRenta)) return;

    const vehiculo = this.obtenerVehiculoRenta(renta);
    const confirmado = await confirmar(
      `Se registrará hoy como fecha real de devolución de la renta #${renta.noRenta}` +
        (vehiculo ? ` (${vehiculo.descripcion}, placa ${vehiculo.noPlaca})` : '') +
        '. Por la regla académica, el vehículo no podrá volver a rentarse.',
      { titulo: '¿Procesar devolución?', textoConfirmar: 'Procesar devolución' },
    );
    if (!confirmado || this.procesando.has(renta.noRenta)) return;

    this.procesando.add(renta.noRenta);
    this.rentaService.devolverRenta(renta.noRenta).subscribe({
      next: (respuesta) => {
        this.procesando.delete(renta.noRenta);
        void notificar(
          `Vehículo devuelto correctamente el ${formatearFecha(respuesta.fechaDevolucion)}. La renta quedó concluida.`,
          'success',
        );
        this.cargarDatos();
      },
      error: (err: unknown) => {
        this.procesando.delete(renta.noRenta);
        void notificar(mensajeError(err, 'No fue posible procesar la devolución.'), 'error');
        this.cargarDatos();
      },
    });
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.nuevaRenta = this.crearRentaVacia();
    this.cdr.markForCheck();
  }

  obtenerVehiculoRenta(renta: Pick<Renta, 'idVehiculo'>): Vehiculo | undefined {
    return this.vehiculos.find((vehiculo) => vehiculo.id === renta.idVehiculo);
  }

  obtenerNombreCliente(idCliente: number): string {
    return this.clientes.find((cliente) => cliente.id === idCliente)?.nombre ?? `Cliente #${idCliente}`;
  }

  obtenerNombreMarca(idMarca: number | null | undefined): string {
    return this.marcas.find((marca) => marca.id === Number(idMarca))?.descripcion ?? 'N/A';
  }

  obtenerNombreModelo(idModelo: number | null | undefined): string {
    return this.modelos.find((modelo) => modelo.id === Number(idModelo))?.descripcion ?? 'N/A';
  }

  /** Vista previa del formulario (misma fórmula y redondeo que la API). */
  get desgloseFormulario(): Desglose {
    return calcularDesglose(this.nuevaRenta.montoXDia, this.nuevaRenta.cantidadDias);
  }

  /** Importes persistidos de una renta registrada. */
  desglose(renta: Renta): Desglose {
    return desgloseRenta(renta);
  }

  fecha(valor: string | null | undefined, vacio = 'Pendiente'): string {
    return formatearFecha(valor, vacio);
  }

  /** Atrasada: activa y con la fecha prevista ya vencida (solo informativo). */
  estaAtrasada(renta: Renta): boolean {
    return renta.estado === 'Activa' && !!renta.fechaDevolucionPrevista && renta.fechaDevolucionPrevista.slice(0, 10) < fechaLocalISO();
  }

  async imprimirContrato(renta: Renta): Promise<void> {
    if (this.procesando.has(renta.noRenta)) return;
    this.procesando.add(renta.noRenta);
    try {
      const vehiculo = this.obtenerVehiculoRenta(renta);
      const doc = generarContratoPdf({
        renta,
        cliente: this.clientes.find((cliente) => cliente.id === renta.idCliente),
        vehiculo,
        marca: this.obtenerNombreMarca(vehiculo?.idMarca),
        modelo: this.obtenerNombreModelo(vehiculo?.idModelo),
        logoBase64: await cargarLogoBase64(),
      });
      doc.save(nombreArchivoContrato(renta.noRenta));
    } catch {
      void notificar('No se pudo generar el contrato en PDF.', 'error');
    } finally {
      this.procesando.delete(renta.noRenta);
      this.cdr.markForCheck();
    }
  }
}
