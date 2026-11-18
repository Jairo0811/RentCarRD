import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Cliente, MarcaTarjeta, TipoPersona } from '../../interfaces/modelos';
import { ClienteService } from '../../services/cliente.service';
import { confirmar, mensajeError, notificar } from '../../shared/alertas';
import { documentoValido, formatearDocumento, longitudDocumento, soloDigitos } from '../../shared/documentos';

export const MARCAS_TARJETA: readonly MarcaTarjeta[] = ['VISA', 'MASTERCARD', 'AMEX', 'DISCOVER'];

/**
 * Clientes (Admin y Empleado).
 *
 * Privacidad: RentCarRD no procesa pagos. El "método de pago" es una referencia SIMULADA
 * formada por la marca y cuatro dígitos ficticios. La interfaz no solicita, no muestra y no
 * envía número completo de tarjeta (PAN), titular, fecha de expiración ni CVV.
 */
@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [FormsModule, CurrencyPipe],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css'],
})
export class ClientesComponent implements OnInit {
  private readonly clienteService = inject(ClienteService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly marcas = MARCAS_TARJETA;

  clientes: Cliente[] = [];
  mostrarFormulario = false;
  modoEdicion = false;
  cargando = true;
  guardando = false;
  errorCarga = '';

  mensajeCedula = '';
  cedulaEsValida = false;
  validandoCedula = false;

  nuevoCliente: Cliente = this.crearClienteVacio();

  ngOnInit(): void {
    this.cargarClientes();
  }

  crearClienteVacio(): Cliente {
    return {
      nombre: '',
      cedula: '',
      limiteCredito: 0,
      estado: true,
      tipoPersona: 'Fisica',
      tipoTarjeta: null,
      ultimosDigitosTarjeta: null,
    };
  }

  cargarClientes(): void {
    this.cargando = true;
    this.errorCarga = '';
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.clientes = [...data];
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorCarga = mensajeError(error, 'No se pudieron cargar los clientes.');
        this.cdr.markForCheck();
      },
    });
  }

  abrirFormulario(): void {
    this.cancelar();
    this.mostrarFormulario = true;
  }

  /** Devuelve el mensaje de validación o null si el formulario es correcto. */
  validarFormulario(): string | null {
    const tipo = this.tipoPersonaActual;
    if (!this.nuevoCliente.nombre?.trim()) {
      return tipo === 'Juridica' ? 'La razón social es obligatoria.' : 'El nombre completo es obligatorio.';
    }
    if (!documentoValido(this.documentoLimpio, tipo)) {
      return tipo === 'Juridica' ? 'El RNC ingresado no es válido.' : 'La cédula ingresada no es válida.';
    }
    if (!this.cedulaEsValida) {
      return this.mensajeCedula || `Debes validar el ${this.nombreDocumento.toLowerCase()}.`;
    }
    const limite = Number(this.nuevoCliente.limiteCredito);
    if (!Number.isFinite(limite) || limite < 0) {
      return 'El límite de crédito no puede ser negativo.';
    }
    return this.validarMetodoPago();
  }

  /** Método de pago simulado: opcional, pero si se indica requiere marca y exactamente 4 dígitos. */
  validarMetodoPago(): string | null {
    const marca = this.nuevoCliente.tipoTarjeta;
    const digitos = this.nuevoCliente.ultimosDigitosTarjeta ?? '';
    if (!marca && !digitos) return null;
    if (!/^\d{4}$/.test(digitos)) return 'Indique únicamente los últimos 4 dígitos de referencia del método de pago simulado.';
    if (!marca || !MARCAS_TARJETA.includes(marca)) return 'Seleccione la marca del método de pago simulado.';
    return null;
  }

  guardarCliente(): void {
    const error = this.validarFormulario();
    if (error) {
      void notificar(error, 'warning');
      return;
    }
    if (this.guardando) return;
    this.guardando = true;

    const cliente: Cliente = {
      ...this.nuevoCliente,
      nombre: this.nuevoCliente.nombre.trim(),
      cedula: this.documentoLimpio,
      limiteCredito: Number(this.nuevoCliente.limiteCredito),
      tipoPersona: this.tipoPersonaActual,
      tipoTarjeta: this.nuevoCliente.ultimosDigitosTarjeta ? this.nuevoCliente.tipoTarjeta : null,
      ultimosDigitosTarjeta: this.nuevoCliente.tipoTarjeta ? this.nuevoCliente.ultimosDigitosTarjeta : null,
    };

    const editando = this.modoEdicion;
    const operacion: Observable<unknown> = editando ? this.clienteService.actualizarCliente(cliente) : this.clienteService.crearCliente(cliente);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        void notificar(editando ? 'Cliente actualizado correctamente.' : 'Cliente guardado correctamente.', 'success');
        this.cancelar();
        this.cargarClientes();
      },
      error: (err: unknown) => {
        this.guardando = false;
        void notificar(mensajeError(err, 'Ocurrió un error al guardar el cliente.'), 'error');
        this.cdr.markForCheck();
      },
    });
  }

  editar(cliente: Cliente): void {
    this.nuevoCliente = {
      ...cliente,
      cedula: formatearDocumento(cliente.cedula, cliente.tipoPersona),
      tipoPersona: cliente.tipoPersona === 'Juridica' ? 'Juridica' : 'Fisica',
    };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.validarCedulaApi();
  }

  async eliminar(cliente: Cliente): Promise<void> {
    if (!cliente.id) return;
    const confirmado = await confirmar(`Se eliminará el cliente "${cliente.nombre}". Esta acción no se puede deshacer.`, {
      titulo: '¿Eliminar cliente?',
      textoConfirmar: 'Eliminar',
      peligroso: true,
    });
    if (!confirmado) return;

    this.clienteService.eliminarCliente(cliente.id).subscribe({
      next: () => {
        void notificar('Cliente eliminado correctamente.', 'success');
        this.cargarClientes();
      },
      error: (err: unknown) =>
        void notificar(mensajeError(err, 'No se pudo eliminar el cliente. Puede estar relacionado con una renta.'), 'error'),
    });
  }

  cancelar(): void {
    this.nuevoCliente = this.crearClienteVacio();
    this.modoEdicion = false;
    this.mostrarFormulario = false;
    this.mensajeCedula = '';
    this.cedulaEsValida = false;
    this.validandoCedula = false;
    this.guardando = false;
    this.cdr.markForCheck();
  }

  get tipoPersonaActual(): TipoPersona {
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

  get documentoLimpio(): string {
    return soloDigitos(this.nuevoCliente.cedula, longitudDocumento(this.tipoPersonaActual));
  }

  onTipoPersonaChange(): void {
    this.nuevoCliente.cedula = '';
    this.mensajeCedula = '';
    this.cedulaEsValida = false;
    this.validandoCedula = false;
  }

  onCedulaInput(): void {
    this.nuevoCliente.cedula = formatearDocumento(this.nuevoCliente.cedula, this.tipoPersonaActual);
    this.mensajeCedula = '';
    this.cedulaEsValida = false;

    const documento = this.documentoLimpio;
    if (!documento) return;
    if (documento.length < longitudDocumento(this.tipoPersonaActual)) {
      this.mensajeCedula = `El ${this.nombreDocumento} debe tener ${longitudDocumento(this.tipoPersonaActual)} dígitos.`;
      return;
    }
    this.validarCedulaApi();
  }

  /** Solo dígitos y como máximo 4: no es posible escribir un número de tarjeta completo. */
  onUltimosDigitosInput(): void {
    this.nuevoCliente.ultimosDigitosTarjeta = soloDigitos(this.nuevoCliente.ultimosDigitosTarjeta, 4) || null;
  }

  validarCedulaApi(): void {
    const documento = this.documentoLimpio;
    const longitud = longitudDocumento(this.tipoPersonaActual);
    this.mensajeCedula = '';
    this.cedulaEsValida = false;

    if (documento.length !== longitud) {
      this.mensajeCedula = `El ${this.nombreDocumento} debe tener ${longitud} dígitos.`;
      return;
    }

    this.validandoCedula = true;
    this.clienteService.validarDocumento(documento, this.tipoPersonaActual, this.nuevoCliente.id).subscribe({
      next: (respuesta) => {
        this.cedulaEsValida = Boolean(respuesta.esValida);
        this.mensajeCedula = respuesta.mensaje;
        this.validandoCedula = false;
        this.cdr.markForCheck();
      },
      error: (err: unknown) => {
        this.mensajeCedula = mensajeError(err, `No se pudo validar el ${this.nombreDocumento}.`);
        this.cedulaEsValida = false;
        this.validandoCedula = false;
        this.cdr.markForCheck();
      },
    });
  }

  formatearDocumentoListado(cliente: Cliente): string {
    return formatearDocumento(cliente.cedula, cliente.tipoPersona);
  }

  obtenerLogoTarjeta(marca: MarcaTarjeta | null | undefined): string {
    const logos: Partial<Record<MarcaTarjeta, string>> = {
      VISA: 'images/cards/visa.png',
      MASTERCARD: 'images/cards/mastercard.png',
    };
    return marca ? (logos[marca] ?? '') : '';
  }
}
