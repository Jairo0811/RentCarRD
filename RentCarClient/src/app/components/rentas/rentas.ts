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
    direccion: 'Av. Winston Churchill #45, Santo Domingo, República Dominicana',
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
  ) { }

  ngOnInit(): void {
    setTimeout(() => this.cargarDatos(), 0);
  }

  obtenerIdEmpleadoActual(): number {
    return Number(localStorage.getItem('idEmpleado') || 1);
  }

  obtenerNombreUsuarioActual(): string {
    return localStorage.getItem('nombreUsuario') || 'Administrador General';
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
      next: ({ rentas, vehiculos, clientes, empleados, marcas, modelos }: any) => {
        this.rentas = [...rentas];
        this.vehiculos = [...vehiculos];
        this.vehiculosDisponibles = this.vehiculos.filter(v => v.estado === true);
        this.clientes = [...clientes];
        this.empleados = [...empleados];
        this.marcas = [...marcas];
        this.modelos = [...modelos];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error cargando datos de rentas', err)
    });
  }

  guardarRenta(): void {
    if (Number(this.nuevaRenta.idVehiculo) === 0 || Number(this.nuevaRenta.idCliente) === 0) {
      alert('Selecciona un vehículo y un cliente válidos.');
      return;
    }

    if (Number(this.nuevaRenta.montoXDia) <= 0 || Number(this.nuevaRenta.cantidadDias) <= 0) {
      alert('El monto por día y la cantidad de días deben ser mayores que cero.');
      return;
    }

    const rentaEnviar = {
      idEmpleado: this.obtenerIdEmpleadoActual(),
      idVehiculo: Number(this.nuevaRenta.idVehiculo),
      idCliente: Number(this.nuevaRenta.idCliente),
      fechaRenta: this.nuevaRenta.fechaRenta,
      fechaDevolucion: null,
      montoXDia: Number(this.nuevaRenta.montoXDia),
      cantidadDias: Number(this.nuevaRenta.cantidadDias),
      comentario: this.nuevaRenta.comentario || '',
      estado: 'Activa'
    };

    this.rentaService.crearRenta(rentaEnviar).subscribe({
      next: () => {
        alert('Renta registrada con éxito.');
        this.cancelarFormulario();
        this.cargarDatos();
      },
      error: (err: any) => {
        console.error('Error al rentar', err);
        alert('Ocurrió un error al guardar la renta.');
      }
    });
  }

  devolverVehiculo(id: number): void {
    if (!confirm('¿Deseas procesar la devolución de este vehículo?')) return;

    this.rentaService.devolverRenta(id).subscribe({
      next: () => {
        alert('Vehículo devuelto con éxito.');
        this.cargarDatos();
      },
      error: (err: any) => console.error('Error al devolver', err)
    });
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.nuevaRenta = this.crearRentaVacia();
    this.cdr.detectChanges();
  }

  obtenerMontoDia(renta: any): number {
    return Number(renta.montoXDia ?? renta.montoXdia ?? 0);
  }

  obtenerTotal(renta: any): number {
    return this.obtenerMontoDia(renta) * Number(renta.cantidadDias ?? 0);
  }

  formatoRD(valor: number): string {
    return `RD$ ${Number(valor || 0).toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  obtenerNombreMarca(idMarca: number): string {
    const marca = this.marcas.find(m => Number(m.id) === Number(idMarca));
    return marca ? marca.descripcion : 'N/A';
  }

  obtenerNombreModelo(idModelo: number): string {
    const modelo = this.modelos.find(m => Number(m.id) === Number(idModelo));
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

    const empleado = this.empleados.find(e =>
      Number(e.id) === idEmpleadoRenta ||
      Number(e.idEmpleado) === idEmpleadoRenta
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
      .then(response => response.blob())
      .then(blob => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }))
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
      next: async ({ rentas, vehiculos, clientes, empleados, marcas, modelos }: any) => {
        this.rentas = [...rentas];
        this.vehiculos = [...vehiculos];
        this.clientes = [...clientes];
        this.empleados = [...empleados];
        this.marcas = [...marcas];
        this.modelos = [...modelos];

        const renta = this.rentas.find(r => Number(r.noRenta) === Number(noRenta));

        if (!renta) {
          alert('No se encontró la renta.');
          return;
        }

        const cliente = this.clientes.find(c => Number(c.id) === Number(renta.idCliente));
        const vehiculo = this.vehiculos.find(v => Number(v.id) === Number(renta.idVehiculo));

        const nombreRepresentante = this.obtenerEmpleadoDeRenta(renta);

        const marca = vehiculo ? this.obtenerNombreMarca(vehiculo.idMarca) : 'N/A';
        const modelo = vehiculo ? this.obtenerNombreModelo(vehiculo.idModelo) : 'N/A';

        const montoDiario = this.obtenerMontoDia(renta);
        const dias = Number(renta.cantidadDias ?? 0);
        const total = montoDiario * dias;

        const logoBase64 = await this.cargarLogoBase64();

        const doc = new jsPDF();

        if (logoBase64) {
          doc.addImage(logoBase64, 'PNG', 14, 10, 28, 28);
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
        doc.text(`Tel.: ${this.empresa.telefono}`, 145, 24);
        doc.text(`Correo: ${this.empresa.correo}`, 145, 30);

        doc.setDrawColor(25, 66, 120);
        doc.setLineWidth(0.8);
        doc.line(14, 44, 196, 44);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('Contrato de Renta de Vehículo', 105, 55, { align: 'center' });

        autoTable(doc, {
          startY: 62,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [25, 66, 120], textColor: 255 },
          head: [['No. Factura', 'Fecha Emisión', 'Estado', 'Empleado']],
          body: [[
            `#${renta.noRenta}`,
            new Date(renta.fechaRenta).toLocaleDateString('es-DO'),
            renta.estado,
            nombreRepresentante
          ]]
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 8,
          theme: 'grid',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [33, 37, 41], textColor: 255 },
          head: [['Datos del Cliente', 'Datos del Vehículo']],
          body: [
            [
              `Nombre: ${cliente?.nombre ?? 'N/A'}\nCédula: ${cliente?.cedula ?? 'N/A'}\nTipo Persona: ${cliente?.tipoPersona ?? cliente?.TipoPersona ?? 'Fisica'}`,
              `Vehículo: ${vehiculo?.descripcion ?? 'N/A'}\nMarca: ${marca}\nModelo: ${modelo}\nPlaca: ${vehiculo?.noPlaca ?? 'N/A'}`
            ]
          ]
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [25, 66, 120], textColor: 255 },
          head: [['Concepto', 'Cantidad', 'Tarifa por Día', 'Subtotal']],
          body: [
            [
              'Renta de Vehículo',
              `${dias} días`,
              this.formatoRD(montoDiario),
              this.formatoRD(total)
            ]
          ]
        });

        const yTotal = (doc as any).lastAutoTable.finalY + 12;

        doc.setFontSize(15);
        doc.setTextColor(39, 174, 96);
        doc.text(`TOTAL FACTURADO: ${this.formatoRD(total)}`, 195, yTotal, { align: 'right' });

        if (renta.comentario) {
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text('Comentario:', 14, yTotal + 12);
          doc.text(String(renta.comentario), 14, yTotal + 18);
        }

        const yFirmas = yTotal + 45;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);

        doc.text('______________________________', 20, yFirmas);
        doc.text('Firma del Cliente', 42, yFirmas + 6);
        doc.text(cliente?.nombre ?? 'Cliente', 42, yFirmas + 12);

        doc.text('______________________________', 120, yFirmas);
        doc.text('Firma del Representante', 138, yFirmas + 6);
        doc.text(nombreRepresentante, 137, yFirmas + 12);

        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Generado por Francis Jairo Matías Rosario - RentCarRD | ${new Date().toLocaleString('es-DO')}`,
          105,
          285,
          { align: 'center' }
        );

        doc.save(`Contrato_Renta_00${renta.noRenta}.pdf`);
      },
      error: (err: any) => {
        console.error('Error generando factura', err);
        alert('No se pudo generar la factura.');
      }
    });
  }
}