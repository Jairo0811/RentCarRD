import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { AuthService } from '../../services/auth.service';

export interface Cliente {
  id?: number;
  nombre: string;
  cedula: string;
  limiteCredito: number;
  estado: boolean;
  tipoPersona: 'Fisica' | 'Juridica';
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
  mensajeCedula = '';
  cedulaEsValida = false;
  validandoCedula = false;
  nuevoCliente: Cliente = this.crearClienteVacio();

  constructor(
    private readonly clienteService: ClienteService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get puedeEliminar(): boolean {
    return this.authService.isAdmin;
  }

  ngOnInit(): void {
    setTimeout(() => this.cargarClientes(), 0);
  }

  crearClienteVacio(): Cliente {
    return {
      nombre: '',
      cedula: '',
      limiteCredito: 0,
      estado: true,
      tipoPersona: 'Fisica'
    };
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data: Cliente[]) => {
        this.clientes = [...data];
        this.cdr.detectChanges();
      },
      error: (error: unknown) => console.error('Error al cargar clientes', error)
    });
  }

  guardarCliente(): void {
    const tipoPersona = this.tipoPersonaActual;
    const documento = this.limpiarDocumento(this.nuevoCliente.cedula);
    const nombre = this.nuevoCliente.nombre.trim();
    const limiteCredito = Number(this.nuevoCliente.limiteCredito);

    if (nombre.length < 3 || nombre.length > 150) {
      alert('El nombre o razón social debe contener entre 3 y 150 caracteres.');
      return;
    }
    if (!this.documentoValido(documento, tipoPersona)) {
      alert(tipoPersona === 'Juridica'
        ? 'El RNC ingresado no es válido.'
        : 'La cédula ingresada no es válida.');
      return;
    }
    if (!this.cedulaEsValida) {
      alert(this.mensajeCedula || `Debes validar el ${this.nombreDocumento.toLowerCase()}.`);
      return;
    }
    if (!Number.isFinite(limiteCredito) || limiteCredito < 0 || limiteCredito > 100_000_000) {
      alert('El límite de crédito debe estar entre 0 y RD$100,000,000.');
      return;
    }

    const payload: Cliente = {
      ...this.nuevoCliente,
      nombre,
      cedula: documento,
      limiteCredito,
      tipoPersona
    };
    const operation = this.modoEdicion
      ? this.clienteService.actualizarCliente(payload)
      : this.clienteService.crearCliente(payload);

    operation.subscribe({
      next: () => {
        alert(this.modoEdicion
          ? 'Cliente actualizado correctamente.'
          : 'Cliente guardado correctamente.');
        this.cancelar();
        this.cargarClientes();
      },
      error: (error: any) => {
        console.error('Error al guardar cliente', error);
        alert(this.obtenerMensajeError(error, 'Ocurrió un error al guardar el cliente.'));
      }
    });
  }

  editar(cliente: Cliente): void {
    this.nuevoCliente = {
      ...cliente,
      cedula: this.formatearDocumento(cliente.cedula, cliente.tipoPersona),
      tipoPersona: cliente.tipoPersona || 'Fisica'
    };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.validarCedulaApi();
    this.cdr.detectChanges();
  }

  eliminar(id?: number): void {
    if (!this.puedeEliminar || !id || !confirm('¿Desea eliminar este cliente?')) return;

    this.clienteService.eliminarCliente(id).subscribe({
      next: () => {
        alert('Cliente eliminado correctamente.');
        this.cargarClientes();
      },
      error: (error: any) => alert(this.obtenerMensajeError(
        error,
        'No se pudo eliminar el cliente. Puede estar relacionado con una renta.'
      ))
    });
  }

  cancelar(): void {
    this.nuevoCliente = this.crearClienteVacio();
    this.modoEdicion = false;
    this.mostrarFormulario = false;
    this.mensajeCedula = '';
    this.cedulaEsValida = false;
    this.validandoCedula = false;
    this.cdr.detectChanges();
  }

  get tipoPersonaActual(): 'Fisica' | 'Juridica' {
    return this.nuevoCliente.tipoPersona === 'Juridica' ? 'Juridica' : 'Fisica';
  }

  get nombreDocumento(): string {
    return this.tipoPersonaActual === 'Juridica' ? 'RNC' : 'Cédula';
  }

  get placeholderDocumento(): string {
    return this.tipoPersonaActual === 'Juridica' ? '000-00000-0' : '000-0000000-0';
  }

  get longitudMaximaDocumento(): number {
    return this.tipoPersonaActual === 'Juridica' ? 11 : 13;
  }

  onTipoPersonaChange(): void {
    this.nuevoCliente.cedula = '';
    this.mensajeCedula = '';
    this.cedulaEsValida = false;
    this.validandoCedula = false;
  }

  limpiarDocumento(documento: string | undefined): string {
    const maximo = this.tipoPersonaActual === 'Juridica' ? 9 : 11;
    return (documento || '').replace(/\D/g, '').slice(0, maximo);
  }

  formatearDocumento(documento: string | undefined, tipoPersona?: string): string {
    const tipo = tipoPersona === 'Juridica' ? 'Juridica' : 'Fisica';
    const maximo = tipo === 'Juridica' ? 9 : 11;
    const limpio = (documento || '').replace(/\D/g, '').slice(0, maximo);
    if (tipo === 'Juridica') {
      if (limpio.length <= 3) return limpio;
      if (limpio.length <= 8) return `${limpio.slice(0, 3)}-${limpio.slice(3)}`;
      return `${limpio.slice(0, 3)}-${limpio.slice(3, 8)}-${limpio.slice(8)}`;
    }
    if (limpio.length <= 3) return limpio;
    if (limpio.length <= 10) return `${limpio.slice(0, 3)}-${limpio.slice(3)}`;
    return `${limpio.slice(0, 3)}-${limpio.slice(3, 10)}-${limpio.slice(10)}`;
  }

  formatearCedulaListado(documento: string, tipoPersona?: string): string {
    return this.formatearDocumento(documento, tipoPersona);
  }

  onCedulaInput(): void {
    this.nuevoCliente.cedula = this.formatearDocumento(
      this.nuevoCliente.cedula,
      this.tipoPersonaActual
    );
    const documento = this.limpiarDocumento(this.nuevoCliente.cedula);
    const longitud = this.tipoPersonaActual === 'Juridica' ? 9 : 11;
    this.mensajeCedula = '';
    this.cedulaEsValida = false;
    if (!documento) return;
    if (documento.length < longitud) {
      this.mensajeCedula = `El ${this.nombreDocumento} debe tener ${longitud} dígitos.`;
      return;
    }
    this.validarCedulaApi();
  }

  validarCedulaApi(): void {
    const documento = this.limpiarDocumento(this.nuevoCliente.cedula);
    const longitud = this.tipoPersonaActual === 'Juridica' ? 9 : 11;
    this.mensajeCedula = '';
    this.cedulaEsValida = false;
    if (documento.length !== longitud) {
      this.mensajeCedula = `El ${this.nombreDocumento} debe tener ${longitud} dígitos.`;
      return;
    }

    this.validandoCedula = true;
    this.clienteService
      .validarDocumento(documento, this.tipoPersonaActual, this.nuevoCliente.id)
      .subscribe({
        next: (response: any) => {
          this.cedulaEsValida = Boolean(response.esValida);
          this.mensajeCedula = response.mensaje;
          this.validandoCedula = false;
          this.cdr.detectChanges();
        },
        error: (error: unknown) => {
          console.error('Error validando documento', error);
          this.mensajeCedula = `No se pudo validar el ${this.nombreDocumento}.`;
          this.cedulaEsValida = false;
          this.validandoCedula = false;
          this.cdr.detectChanges();
        }
      });
  }

  documentoValido(documento: string, tipoPersona: string): boolean {
    return tipoPersona === 'Juridica' ? this.rncValido(documento) : this.cedulaValida(documento);
  }

  cedulaValida(cedula: string): boolean {
    cedula = (cedula || '').replace(/\D/g, '');
    if (cedula.length !== 11 || /^(\d)\1{10}$/.test(cedula)) return false;
    const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let index = 0; index < 10; index++) {
      let valor = Number(cedula[index]) * pesos[index];
      if (valor >= 10) valor = Math.floor(valor / 10) + (valor % 10);
      suma += valor;
    }
    return (10 - (suma % 10)) % 10 === Number(cedula[10]);
  }

  rncValido(rnc: string): boolean {
    rnc = (rnc || '').replace(/\D/g, '');
    if (rnc.length !== 9 || /^(\d)\1{8}$/.test(rnc)) return false;
    const pesos = [7, 9, 8, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let index = 0; index < 8; index++) suma += Number(rnc[index]) * pesos[index];
    const resto = suma % 11;
    const digito = resto === 0 ? 2 : resto === 1 ? 1 : 11 - resto;
    return digito === Number(rnc[8]);
  }

  obtenerMensajeError(error: any, fallback: string): string {
    if (typeof error?.error === 'string') return error.error;
    if (error?.error?.message) return error.error.message;
    if (error?.error?.title) return error.error.title;
    return fallback;
  }
}
