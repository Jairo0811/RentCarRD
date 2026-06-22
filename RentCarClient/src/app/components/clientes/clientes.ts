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
  
  nuevoCliente: Cliente = { 
    nombre: '', 
    cedula: '', 
    limiteCredito: 0, 
    estado: true,
    noTarjetaCr: '',       // En blanco para capturar el dato
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

    this.clienteService.crearCliente(this.nuevoCliente).subscribe({
      next: () => { 
        alert('¡Cliente guardado con éxito!'); 
        this.cargarClientes(); 
        
        // Limpiamos el formulario al guardar
        this.nuevoCliente = { nombre: '', cedula: '', limiteCredito: 0, estado: true, noTarjetaCr: '', tipoPersona: 'Física' }; 
        this.mostrarFormulario = false;
      },
      error: (err) => {
        console.error('Error al guardar', err);
        alert('Ocurrió un error al guardar. Revisa la consola para más detalles.');
      }
    });
  }

  // =========================================================
  // MÉTODOS PARA DETECTAR LA MARCA DE LA TARJETA DE CRÉDITO
  // =========================================================

  identificarTarjeta(numero: string | undefined): string {
    if (!numero) return '';
    
    // Limpiamos los guiones o espacios que el usuario pueda escribir
    const numLimpio = numero.replace(/\D/g, ''); 
    
    if (numLimpio.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(numLimpio) || /^2[2-7]/.test(numLimpio)) return 'MASTERCARD';
    if (/^3[47]/.test(numLimpio)) return 'AMEX';
    if (/^6/.test(numLimpio)) return 'DISCOVER';
    
    return numLimpio.length > 0 ? 'Desconocida' : '';
  }

  obtenerColorTarjeta(marca: string): string {
    switch(marca) {
      case 'VISA': return 'text-bg-primary';       // Azul
      case 'MASTERCARD': return 'text-bg-warning'; // Amarillo/Naranja
      case 'AMEX': return 'text-bg-success';       // Verde
      case 'DISCOVER': return 'text-bg-info';      // Celeste
      default: return 'text-bg-secondary';         // Gris
    }
  }
}