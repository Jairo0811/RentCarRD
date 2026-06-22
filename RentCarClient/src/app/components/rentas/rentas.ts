import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RentaService } from '../../services/renta.service';
import { VehiculoService } from '../../services/vehiculo.service';
import { ClienteService } from '../../services/cliente.service';
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
  mostrarFormulario = false;

  nuevaRenta: any = {
    idEmpleado: 1,
    idVehiculo: 0,
    idCliente: 0,
    fechaRenta: new Date().toISOString().split('T')[0],
    fechaDevolucion: null,
    montoXdia: 0, // <-- 'd' minúscula
    cantidadDias: 1,
    comentario: '',
    estado: 'Abierta'
  };

  constructor(
    private rentaService: RentaService,
    private vehiculoService: VehiculoService,
    private clienteService: ClienteService
  ) { }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.rentaService.getRentas().subscribe({
      next: (data) => this.rentas = data,
      error: (err) => console.error(err)
    });
    
    this.vehiculoService.getVehiculos().subscribe({
      next: (data) => {
        this.vehiculos = data;
        this.vehiculosDisponibles = this.vehiculos.filter(v => v.estado === true || v.estado === 'Disponible');
      },
      error: (err) => console.error(err)
    });
    
    this.clienteService.getClientes().subscribe({
      next: (data) => this.clientes = data,
      error: (err) => console.error(err)
    });
  }

  guardarRenta() {
    if (this.nuevaRenta.idVehiculo == 0 || this.nuevaRenta.idCliente == 0) {
      alert("¡Por favor, selecciona un Vehículo y un Cliente válidos!");
      return;
    }

    this.rentaService.crearRenta(this.nuevaRenta).subscribe({
      next: () => {
        alert('¡Renta registrada con éxito!');
        this.mostrarFormulario = false;
        
        this.nuevaRenta = {
          idEmpleado: 1, idVehiculo: 0, idCliente: 0,
          fechaRenta: new Date().toISOString().split('T')[0],
          fechaDevolucion: null, montoXdia: 0, cantidadDias: 1, // <-- 'd' minúscula
          comentario: '', estado: 'Abierta'
        };
        
        this.cargarDatos(); 
      },
      error: (err) => {
        console.error("Error al rentar", err);
        alert("Ocurrió un error al guardar la renta. Asegúrate de que el vehículo esté disponible.");
      }
    });
  }

  devolverVehiculo(id: number) {
    if (confirm('¿Estás seguro de que deseas procesar la devolución de este vehículo?')) {
      this.rentaService.devolverRenta(id).subscribe({
        next: () => {
          alert('¡Vehículo devuelto con éxito!');
          this.cargarDatos();
        },
        error: (err) => console.error("Error al devolver", err)
      });
    }
  }

  imprimirFactura(noRenta: number) {
    const renta = this.rentas.find(r => r.noRenta === noRenta);
    if (!renta) return;

    const cliente = this.clientes.find(c => c.id === renta.idCliente);
    const vehiculo = this.vehiculos.find(v => v.id === renta.idVehiculo);
    
    // <-- 'd' minúscula aquí también
    const montoDiario = renta.montoXdia || 0; 
    const dias = renta.cantidadDias || 0;
    const total = montoDiario * dias;
    
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(40, 116, 166);
    doc.text("Rent-a-Car Pro", 105, 20, { align: "center" });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Contrato de Renta de Vehículo", 105, 30, { align: "center" });

    doc.setFontSize(11);
    doc.text(`No. de Factura: #${renta.noRenta}`, 14, 45);
    doc.text(`Fecha de Emisión: ${new Date(renta.fechaRenta).toLocaleDateString()}`, 14, 52);
    doc.text(`Estado de Renta: ${renta.estado}`, 14, 59);

    autoTable(doc, {
      startY: 65,
      theme: 'grid',
      head: [['Datos del Cliente', 'Datos del Vehículo']],
      body: [
        [
          `Nombre: ${cliente ? cliente.nombre : 'N/A'}\nCédula: ${cliente ? cliente.cedula : 'N/A'}`, 
          `Vehículo: ${vehiculo ? vehiculo.descripcion : 'N/A'}\nPlaca: ${vehiculo ? vehiculo.noPlaca : 'N/A'}`
        ]
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: 'striped',
      head: [['Concepto', 'Cantidad', 'Tarifa por Día', 'Subtotal']],
      body: [
        [
          'Renta de Vehículo', 
          `${dias} días`, 
          `RD$ ${montoDiario.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 
          `RD$ ${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`
        ]
      ],
    });

    doc.setFontSize(14);
    doc.setTextColor(39, 174, 96);
    doc.text(`TOTAL FACTURADO: RD$ ${total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`, 195, (doc as any).lastAutoTable.finalY + 15, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Firma del Cliente: ___________________________", 14, (doc as any).lastAutoTable.finalY + 45);
    doc.text("Firma Autorizada: ___________________________", 110, (doc as any).lastAutoTable.finalY + 45);
    
    doc.text(`Generado por Jairo Matías - Sistema Rent-a-Car Pro`, 105, 280, { align: "center" });

    doc.save(`Contrato_Renta_00${renta.noRenta}.pdf`);
  }
}