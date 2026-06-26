import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';

export interface Cliente {
  id?: number;
  nombre: string;
  cedula: string;
  limiteCredito: number;
  estado: boolean;
  noTarjetaCr?: string;
  tipoPersona?: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css']
})
export class ClientesComponent implements OnInit {
  
  clientes: Cliente[] = [];
  mostrarFormulario = false;
  modoEdicion = false;
  
  nuevoCliente: Cliente = { 
    nombre: '', 
    cedula: '', 
    limiteCredito: 0, 
    estado: true,
    noTarjetaCr: '',
    tipoPersona: 'Física' 
  };

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void { 
    this.cargarClientes(); 
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => this.clientes = data,
      error: (err) => console.error('Error al cargar clientes', err)
    });
  }

  guardarCliente(): void {
    if (!this.nuevoCliente.nombre || !this.nuevoCliente.cedula) {
      alert('Por favor, completa el nombre y la cédula.');
      return;
    }

    if (this.modoEdicion) {
      this.clienteService.actualizarCliente(this.nuevoCliente).subscribe({
        next: () => {
          alert('Cliente actualizado correctamente');
          this.cargarClientes();
          this.cancelar();
        },
        error: (err) => {
          console.error('Error al actualizar', err);
          alert('Ocurrió un error al actualizar. Revisa la consola.');
        }
      });
    } else {
      this.clienteService.crearCliente(this.nuevoCliente).subscribe({
        next: () => {
          alert('Cliente guardado correctamente');
          this.cargarClientes();
          this.cancelar();
        },
        error: (err) => {
          console.error('Error al guardar', err);
          alert('Ocurrió un error al guardar. Revisa la consola.');
        }
      });
    }
  }

  editar(cliente: Cliente): void {
    this.nuevoCliente = { ...cliente };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
  }

  eliminar(id?: number): void {
    if (!id) return;

    if (!confirm('¿Desea eliminar este cliente?')) {
      return;
    }

    this.clienteService.eliminarCliente(id).subscribe({
      next: () => {
        alert('Cliente eliminado correctamente');
        this.cargarClientes();
      },
      error: (err) => {
        console.error('Error al eliminar', err);
        alert('No se pudo eliminar el cliente. Puede estar relacionado con una renta.');
      }
    });
  }

  cancelar(): void {
    this.nuevoCliente = {
      nombre: '',
      cedula: '',
      limiteCredito: 0,
      estado: true,
      noTarjetaCr: '',
      tipoPersona: 'Física'
    };

    this.modoEdicion = false;
    this.mostrarFormulario = false;
  }

  identificarTarjeta(numero: string | undefined): string {
    if (!numero) return '';
    
    const numLimpio = numero.replace(/\D/g, ''); 
    
    if (numLimpio.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(numLimpio) || /^2[2-7]/.test(numLimpio)) return 'MASTERCARD';
    if (/^3[47]/.test(numLimpio)) return 'AMEX';
    if (/^6/.test(numLimpio)) return 'DISCOVER';
    
    return numLimpio.length > 0 ? 'Desconocida' : '';
  }

  obtenerColorTarjeta(marca: string): string {
    switch(marca) {
      case 'VISA': return 'text-bg-primary';
      case 'MASTERCARD': return 'text-bg-warning';
      case 'AMEX': return 'text-bg-success';
      case 'DISCOVER': return 'text-bg-info';
      default: return 'text-bg-secondary';
    }
  }
}