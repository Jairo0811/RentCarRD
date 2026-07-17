import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { RentaService } from '../../services/renta.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { ClienteService } from '../../services/cliente.service';
import { EmpleadoService } from '../../services/empleado.service';
import { MarcaService } from '../../services/marca.service';
import { ModeloService } from '../../services/modelo.service';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-rentas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rentas.html',
  styleUrl: './rentas.css'
})
export class Rentas implements OnInit {
  private readonly tasaItbis = 0.18;

  rentas: any[] = [];
  vehiculos: any[] = [];
  vehiculosDisponibles: any[] = [];
  clientes: any[] = [];
  empleados: any[] = [];
  marcas: any[] = [];
  modelos: any[] = [];

  mostrarFormulario = false;

  nuevaRenta: any = this.crearRentaVacia();

  empresa = {
    nombre: 'RentCarRD',
    subtitulo: 'Alquiler de Vehículos',
    rnc: '1-31-98765-4',
    direccion:
      'Av. Winston Churchill #45, Santo Domingo, República Dominicana',
    telefono: '(809) 555-2026',
    correo: 'info@rentcarrd.com'
  };

  constructor(
    private rentaService: RentaService,
    private vehiculoService: VehiculoService,
    private clienteService: ClienteService,
    private empleadoService: EmpleadoService,
    private marcaService: MarcaService,
    private modeloService: ModeloService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => this.cargarDatos(), 0);
  }

  obtenerIdEmpleadoActual(): number {
    if (
      typeof window === 'undefined' ||
      typeof localStorage === 'undefined'
    ) {
      return 1;
    }

    return Number(localStorage.getItem('idEmpleado') || 1);
  }

  obtenerNombreUsuarioActual(): string {
    if (
      typeof window === 'undefined' ||
      typeof localStorage === 'undefined'
    ) {
      return 'Administrador General';
    }

    return (
      localStorage.getItem('nombreUsuario') ||
      'Administrador General'
    );
  }

  crearRentaVacia(): any {
    return {
      idEmpleado: this.obtenerIdEmpleadoActual(),
      idVehiculo: 0,
      idCliente: 0,
      fechaRenta: new Date().toISOString().split('T')[0],
      fechaDevolucion: null,
      montoXDia: 0,
      cantidadDias: 1,
      subtotal: 0,
      itbis: 0,
      total: 0,
      comentario: '',
      estado: 'Activa'
    };
  }

  cargarDatos(): void {
    forkJoin({
      rentas: this.rentaService.getRentas(),
      vehiculos: this.vehiculoService.getVehiculos(),
      clientes: this.clienteService.getClientes(),
      empleados: this.empleadoService.getEmpleados(),
      marcas: this.marcaService.getMarcas(),
      modelos: this.modeloService.getModelos()
    }).subscribe({
      next: ({
        rentas,
        vehiculos,
        clientes,
        empleados,
        marcas,
        modelos
      }: any) => {
        this.rentas = [...rentas];
        this.vehiculos = [...vehiculos];
        this.clientes = [...clientes];
        this.empleados = [...empleados];
        this.marcas = [...marcas];
        this.modelos = [...modelos];

        const idsVehiculosRentados = new Set(
          this.rentas.map((renta: any) =>
            Number(renta.idVehiculo)
          )
        );

        this.vehiculosDisponibles =
          this.vehiculos.filter((vehiculo: any) =>
            this.obtenerEstadoOperacionVehiculo(vehiculo) ===
              'Disponible' &&
            !idsVehiculosRentados.has(Number(vehiculo.id))
          );

        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error(
          'Error cargando datos de rentas',
          err
        );
      }
    });
  }

  guardarRenta(): void {
    const idVehiculo = Number(
      this.nuevaRenta.idVehiculo
    );

    const idCliente = Number(
      this.nuevaRenta.idCliente
    );

    const montoPorDia = Number(
      this.nuevaRenta.montoXDia
    );

    const cantidadDias = Number(
      this.nuevaRenta.cantidadDias
    );

    if (idVehiculo <= 0 || idCliente <= 0) {
      alert(
        'Selecciona un vehículo y un cliente válidos.'
      );
      return;
    }

    if (montoPorDia <= 0 || cantidadDias <= 0) {
      alert(
        'El monto por día y la cantidad de días deben ser mayores que cero.'
      );
      return;
    }

    const vehiculoSeleccionado =
      this.vehiculos.find((vehiculo: any) =>
        Number(vehiculo.id) === idVehiculo
      );

    if (!vehiculoSeleccionado) {
      alert(
        'No se encontró el vehículo seleccionado.'
      );
      return;
    }

    const fueRentadoAnteriormente =
      this.rentas.some((renta: any) =>
        Number(renta.idVehiculo) === idVehiculo
      );

    if (fueRentadoAnteriormente) {
      alert(
        'Este vehículo ya fue rentado anteriormente y no puede volver a rentarse.'
      );

      this.nuevaRenta.idVehiculo = 0;
      return;
    }

    if (
      this.obtenerEstadoOperacionVehiculo(
        vehiculoSeleccionado
      ) !== 'Disponible'
    ) {
      alert(
        'Este vehículo no está disponible para renta.'
      );
      return;
    }

    const subtotal = this.calcularSubtotalValores(
      montoPorDia,
      cantidadDias
    );

    const itbis = this.calcularItbisValor(subtotal);
    const total = subtotal + itbis;

    const rentaEnviar = {
      idEmpleado: this.obtenerIdEmpleadoActual(),
      idVehiculo,
      idCliente,
      fechaRenta: this.nuevaRenta.fechaRenta,
      fechaDevolucion: null,
      montoXDia: montoPorDia,
      cantidadDias,
      subtotal,
      itbis,
      total,
      comentario:
        this.nuevaRenta.comentario?.trim() || '',
      estado: 'Activa'
    };

    this.rentaService.crearRenta(rentaEnviar).subscribe({
      next: () => {
        alert('Renta registrada con éxito.');

        this.cancelarFormulario();
        this.cargarDatos();
      },
      error: (err: any) => {
        console.error(
          'Error al registrar la renta',
          err
        );

        const mensaje =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message ||
              'Ocurrió un error al registrar la renta.';

        alert(mensaje);
        this.cargarDatos();
      }
    });
  }

  devolverVehiculo(id: number): void {
    const renta = this.rentas.find((item: any) =>
      Number(item.noRenta) === Number(id)
    );

    if (!renta) {
      alert(
        'No se encontró la renta seleccionada.'
      );
      return;
    }

    if (
      String(renta.estado)
        .trim()
        .toLowerCase() === 'concluida'
    ) {
      alert('Esta renta ya fue concluida.');
      return;
    }

    const confirmar = confirm(
      '¿Deseas procesar la devolución?\n\n' +
      'El vehículo quedará fuera de futuras rentas.'
    );

    if (!confirmar) {
      return;
    }

    this.rentaService.devolverRenta(id).subscribe({
      next: () => {
        alert(
          'Vehículo devuelto correctamente. La renta quedó concluida y el vehículo no podrá rentarse nuevamente.'
        );

        this.cargarDatos();
      },
      error: (err: any) => {
        console.error(
          'Error al procesar la devolución',
          err
        );

        const mensaje =
          typeof err.error === 'string'
            ? err.error
            : err.error?.message ||
              'No fue posible procesar la devolución.';

        alert(mensaje);
      }
    });
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.nuevaRenta = this.crearRentaVacia();
    this.cdr.detectChanges();
  }

  vehiculoDisponible(idVehiculo: number): boolean {
    const vehiculo = this.vehiculos.find(
      (item: any) =>
        Number(item.id) === Number(idVehiculo)
    );

    return (
      this.obtenerEstadoOperacionVehiculo(vehiculo) ===
      'Disponible'
    );
  }

  obtenerEstadoOperacionVehiculo(
    vehiculo: any
  ): string {
    const estado = String(
      vehiculo?.estadoOperacion ?? ''
    ).trim();

    if (
      estado === 'Disponible' ||
      estado === 'Rentado' ||
      estado === 'NoDisponible'
    ) {
      return estado;
    }

    return vehiculo?.estado === true
      ? 'Disponible'
      : 'Rentado';
  }

  formatearFecha(
    fecha: string | Date | null | undefined
  ): string {
    if (!fecha) {
      return 'Pendiente';
    }

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return 'Pendiente';
    }

    return valor.toLocaleDateString('es-DO');
  }

  obtenerMontoDia(renta: any): number {
    return Number(
      renta?.montoXDia ??
      renta?.montoXdia ??
      0
    );
  }

  calcularSubtotalValores(
    montoXDia: number,
    cantidadDias: number
  ): number {
    return Number(montoXDia || 0) *
      Number(cantidadDias || 0);
  }

  calcularItbisValor(subtotal: number): number {
    return Number(
      (Number(subtotal || 0) * this.tasaItbis)
        .toFixed(2)
    );
  }

  obtenerSubtotal(renta: any): number {
    const subtotalGuardado = Number(
      renta?.subtotal ?? 0
    );

    if (subtotalGuardado > 0) {
      return subtotalGuardado;
    }

    return this.calcularSubtotalValores(
      this.obtenerMontoDia(renta),
      Number(renta?.cantidadDias ?? 0)
    );
  }

  obtenerItbis(renta: any): number {
    const itbisGuardado = Number(
      renta?.itbis ?? 0
    );

    if (itbisGuardado > 0) {
      return itbisGuardado;
    }

    return this.calcularItbisValor(
      this.obtenerSubtotal(renta)
    );
  }

 obtenerTotal(renta: any): number {
  const subtotal = this.obtenerSubtotal(renta);
  const itbis = this.obtenerItbis(renta);
  const totalCalculado = subtotal + itbis;

  const totalGuardado = Number(
    renta?.total ?? 0
  );

  const tieneDesglosePersistido =
    Number(renta?.subtotal ?? 0) > 0 &&
    Number(renta?.itbis ?? 0) > 0;

  if (
    tieneDesglosePersistido &&
    totalGuardado >= totalCalculado
  ) {
    return totalGuardado;
  }

  return Number(totalCalculado.toFixed(2));
}

  obtenerSubtotalFormulario(): number {
    return this.calcularSubtotalValores(
      Number(this.nuevaRenta.montoXDia || 0),
      Number(this.nuevaRenta.cantidadDias || 0)
    );
  }

  obtenerItbisFormulario(): number {
    return this.calcularItbisValor(
      this.obtenerSubtotalFormulario()
    );
  }

  obtenerTotalFormulario(): number {
    return (
      this.obtenerSubtotalFormulario() +
      this.obtenerItbisFormulario()
    );
  }

  formatoRD(valor: number): string {
    return `RD$ ${Number(valor || 0)
      .toLocaleString('es-DO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`;
  }

  obtenerNombreMarca(idMarca: number): string {
    const marca = this.marcas.find(
      (item: any) =>
        Number(item.id) === Number(idMarca)
    );

    return marca ? marca.descripcion : 'N/A';
  }

  obtenerNombreModelo(idModelo: number): string {
    const modelo = this.modelos.find(
      (item: any) =>
        Number(item.id) === Number(idModelo)
    );

    return modelo ? modelo.descripcion : 'N/A';
  }

  obtenerEmpleadoDeRenta(renta: any): string {
    const idEmpleadoRenta = Number(
      renta.idEmpleado ??
      renta.idempleado ??
      renta.idEmpleadoNavigation?.id ??
      renta.empleado?.id ??
      0
    );

    const empleado = this.empleados.find(
      (item: any) =>
        Number(item.id) === idEmpleadoRenta ||
        Number(item.idEmpleado) === idEmpleadoRenta
    );

    return (
      empleado?.nombre ||
      renta.empleado?.nombre ||
      renta.idEmpleadoNavigation?.nombre ||
      this.obtenerNombreUsuarioActual()
    );
  }

  cargarLogoBase64(): Promise<string | null> {
    return fetch('images/logo-rentcarrd.png')
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();

            reader.onloadend = () =>
              resolve(reader.result as string);

            reader.readAsDataURL(blob);
          })
      )
      .catch(() => null);
  }

  imprimirFactura(noRenta: number): void {
    forkJoin({
      rentas: this.rentaService.getRentas(),
      vehiculos: this.vehiculoService.getVehiculos(),
      clientes: this.clienteService.getClientes(),
      empleados: this.empleadoService.getEmpleados(),
      marcas: this.marcaService.getMarcas(),
      modelos: this.modeloService.getModelos()
    }).subscribe({
      next: async ({
        rentas,
        vehiculos,
        clientes,
        empleados,
        marcas,
        modelos
      }: any) => {
        this.rentas = [...rentas];
        this.vehiculos = [...vehiculos];
        this.clientes = [...clientes];
        this.empleados = [...empleados];
        this.marcas = [...marcas];
        this.modelos = [...modelos];

        const renta = this.rentas.find(
          (item: any) =>
            Number(item.noRenta) === Number(noRenta)
        );

        if (!renta) {
          alert('No se encontró la renta.');
          return;
        }

        const cliente = this.clientes.find(
          (item: any) =>
            Number(item.id) ===
            Number(renta.idCliente)
        );

        const vehiculo = this.vehiculos.find(
          (item: any) =>
            Number(item.id) ===
            Number(renta.idVehiculo)
        );

        const nombreRepresentante =
          this.obtenerEmpleadoDeRenta(renta);

        const marca = vehiculo
          ? this.obtenerNombreMarca(vehiculo.idMarca)
          : 'N/A';

        const modelo = vehiculo
          ? this.obtenerNombreModelo(
              vehiculo.idModelo
            )
          : 'N/A';

        const montoDiario =
          this.obtenerMontoDia(renta);

        const dias = Number(
          renta.cantidadDias ?? 0
        );

        const subtotal =
          this.obtenerSubtotal(renta);

        const itbis =
          this.obtenerItbis(renta);

        const total =
          this.obtenerTotal(renta);

        const limiteCredito = Number(
          cliente?.limiteCredito ?? 0
        );

        const logoBase64 =
          await this.cargarLogoBase64();

        const doc = new jsPDF();

        if (logoBase64) {
          doc.addImage(
            logoBase64,
            'PNG',
            14,
            10,
            28,
            28
          );
        }

        doc.setFontSize(20);
        doc.setTextColor(25, 66, 120);
        doc.text(this.empresa.nombre, 48, 18);

        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        doc.text(this.empresa.subtitulo, 48, 24);
        doc.text(`RNC: ${this.empresa.rnc}`, 48, 30);
        doc.text(this.empresa.direccion, 48, 36);

        doc.setFontSize(9);
        doc.text(
          `Tel.: ${this.empresa.telefono}`,
          145,
          24
        );

        doc.text(
          `Correo: ${this.empresa.correo}`,
          145,
          30
        );

        doc.setDrawColor(25, 66, 120);
        doc.setLineWidth(0.8);
        doc.line(14, 44, 196, 44);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);

        doc.text(
          'Contrato de Renta de Vehículo',
          105,
          55,
          { align: 'center' }
        );

        autoTable(doc, {
          startY: 62,
          theme: 'grid',
          styles: {
            fontSize: 9
          },
          headStyles: {
            fillColor: [25, 66, 120],
            textColor: 255
          },
          head: [[
            'No. Factura',
            'Fecha Renta',
            'Fecha Devolución',
            'Estado',
            'Empleado'
          ]],
          body: [[
            `#${renta.noRenta}`,
            this.formatearFecha(renta.fechaRenta),
            this.formatearFecha(
              renta.fechaDevolucion
            ),
            renta.estado,
            nombreRepresentante
          ]]
        });

        autoTable(doc, {
          startY:
            (doc as any).lastAutoTable.finalY + 8,
          theme: 'grid',
          styles: {
            fontSize: 9,
            cellPadding: 3
          },
          headStyles: {
            fillColor: [33, 37, 41],
            textColor: 255
          },
          head: [[
            'Datos del Cliente',
            'Datos del Vehículo'
          ]],
          body: [[
            `Nombre: ${cliente?.nombre ?? 'N/A'}\n` +
            `Cédula: ${cliente?.cedula ?? 'N/A'}\n` +
            `Tipo Persona: ${
              cliente?.tipoPersona ??
              cliente?.TipoPersona ??
              'Fisica'
            }\n` +
            `Límite de Crédito: ${
              this.formatoRD(limiteCredito)
            }`,

            `Vehículo: ${
              vehiculo?.descripcion ?? 'N/A'
            }\n` +
            `Marca: ${marca}\n` +
            `Modelo: ${modelo}\n` +
            `Placa: ${
              vehiculo?.noPlaca ?? 'N/A'
            }`
          ]]
        });

        autoTable(doc, {
          startY:
            (doc as any).lastAutoTable.finalY + 10,
          theme: 'striped',
          styles: {
            fontSize: 10
          },
          headStyles: {
            fillColor: [25, 66, 120],
            textColor: 255
          },
          head: [[
            'Concepto',
            'Cantidad',
            'Tarifa por Día',
            'Subtotal'
          ]],
          body: [[
            'Renta de Vehículo',
            `${dias} días`,
            this.formatoRD(montoDiario),
            this.formatoRD(subtotal)
          ]]
        });

        const yResumen =
          (doc as any).lastAutoTable.finalY + 10;

        autoTable(doc, {
          startY: yResumen,
          margin: {
            left: 110
          },
          tableWidth: 86,
          theme: 'grid',
          styles: {
            fontSize: 10,
            halign: 'right'
          },
          headStyles: {
            fillColor: [33, 37, 41],
            textColor: 255
          },
          body: [
            [
              'Subtotal',
              this.formatoRD(subtotal)
            ],
            [
              'ITBIS (18%)',
              this.formatoRD(itbis)
            ],
            [
              'TOTAL A PAGAR',
              this.formatoRD(total)
            ]
          ],
          columnStyles: {
            0: {
              fontStyle: 'bold',
              halign: 'left'
            },
            1: {
              halign: 'right'
            }
          },
          didParseCell: (data: any) => {
            if (data.row.index === 2) {
              data.cell.styles.fillColor = [
                39,
                174,
                96
              ];

              data.cell.styles.textColor = [
                255,
                255,
                255
              ];

              data.cell.styles.fontStyle = 'bold';
            }
          }
        });

        const yFinal =
          (doc as any).lastAutoTable.finalY;

        if (renta.comentario) {
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);

          doc.text(
            'Comentario:',
            14,
            yFinal + 12
          );

          doc.text(
            String(renta.comentario),
            14,
            yFinal + 18
          );
        }

        const yFirmas = Math.max(
          yFinal + 42,
          220
        );

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);

        doc.text(
          '______________________________',
          20,
          yFirmas
        );

        doc.text(
          'Firma del Cliente',
          42,
          yFirmas + 6
        );

        doc.text(
          cliente?.nombre ?? 'Cliente',
          42,
          yFirmas + 12
        );

        doc.text(
          '______________________________',
          120,
          yFirmas
        );

        doc.text(
          'Firma del Representante',
          138,
          yFirmas + 6
        );

        doc.text(
          nombreRepresentante,
          137,
          yFirmas + 12
        );

        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);

        doc.text(
          `Generado por Francis Jairo Matías Rosario - RentCarRD | ${new Date().toLocaleString('es-DO')}`,
          105,
          285,
          { align: 'center' }
        );

        doc.save(
          `Contrato_Renta_${String(
            renta.noRenta
          ).padStart(3, '0')}.pdf`
        );
      },
      error: (err: any) => {
        console.error(
          'Error generando factura',
          err
        );

        alert(
          'No se pudo generar la factura.'
        );
      }
    });
  }
}