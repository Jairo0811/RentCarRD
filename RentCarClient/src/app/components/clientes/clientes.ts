import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  
  nuevoCliente: Cliente = this.crearClienteVacio();

  constructor(
    private clienteService: ClienteService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { 
    setTimeout(() => this.cargarClientes(), 0);
  }

  crearClienteVacio(): Cliente {
    return {
      nombre: '',
      cedula: '',
      limiteCredito: 0,
      estado: true,
      noTarjetaCr: '',
      tipoPersona: 'Física'
    };
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data: Cliente[]) => {
        this.clientes = [...data];
        this.cdr.detectChanges();
      },
      error: (err: any) => console.error('Error al cargar clientes', err)
    });
  }

  guardarCliente(): void {
    if (!this.nuevoCliente.nombre || !this.nuevoCliente.cedula) {
      alert('Por favor, completa el nombre y la cédula.');
      return;
    }

    const cedulaLimpia = this.limpiarCedula(this.nuevoCliente.cedula);

    if (!this.cedulaValida(cedulaLimpia)) {
      alert('La cédula ingresada no es válida.');
      return;
    }

    const clienteEnviar: Cliente = {
      ...this.nuevoCliente,
      cedula: cedulaLimpia
    };

    if (this.modoEdicion) {
      this.clienteService.actualizarCliente(clienteEnviar).subscribe({
        next: () => {
          alert('Cliente actualizado correctamente');
          this.cancelar();
          this.cargarClientes();
        },
        error: (err: any) => {
          console.error('Error al actualizar', err);
          alert(err.error || 'Ocurrió un error al actualizar. Revisa la consola.');
        }
      });
    } else {
      this.clienteService.crearCliente(clienteEnviar).subscribe({
        next: () => {
          alert('Cliente guardado correctamente');
          this.cancelar();
          this.cargarClientes();
        },
        error: (err: any) => {
          console.error('Error al guardar', err);
          alert(err.error || 'Ocurrió un error al guardar. Revisa la consola.');
        }
      });
    }
  }

  editar(cliente: Cliente): void {
    this.nuevoCliente = { ...cliente };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.cdr.detectChanges();
  }

  eliminar(id?: number): void {
    if (!id) return;

    if (!confirm('¿Desea eliminar este cliente?')) return;

    this.clienteService.eliminarCliente(id).subscribe({
      next: () => {
        alert('Cliente eliminado correctamente');
        this.cargarClientes();
      },
      error: (err: any) => {
        console.error('Error al eliminar', err);
        alert('No se pudo eliminar el cliente. Puede estar relacionado con una renta.');
      }
    });
  }

  cancelar(): void {
    this.nuevoCliente = this.crearClienteVacio();
    this.modoEdicion = false;
    this.mostrarFormulario = false;
    this.cdr.detectChanges();
  }

  limpiarCedula(cedula: string): string {
    return (cedula || '').replace(/\D/g, '');
  }

  cedulaValida(cedula: string): boolean {
    cedula = this.limpiarCedula(cedula);

    if (cedula.length !== 11) return false;

    if (/^(\d)\1{10}$/.test(cedula)) return false;

    const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 10; i++) {
      let valor = Number(cedula[i]) * pesos[i];

      if (valor >= 10) {
        valor = Math.floor(valor / 10) + (valor % 10);
      }

      suma += valor;
    }

    const digitoVerificador = (10 - (suma % 10)) % 10;

    return digitoVerificador === Number(cedula[10]);
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
    switch (marca) {
      case 'VISA': return 'text-bg-primary';
      case 'MASTERCARD': return 'text-bg-warning';
      case 'AMEX': return 'text-bg-success';
      case 'DISCOVER': return 'text-bg-info';
      default: return 'text-bg-secondary';
    }
  }
}