import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  nombreTitularTarjeta?: string;
  fechaExpiracionTarjeta?: string;
  tipoTarjeta?: string;
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

  mensajeCedula = '';
  cedulaEsValida = false;
  validandoCedula = false;
  cvvTemporal = '';

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
      nombreTitularTarjeta: '',
      fechaExpiracionTarjeta: '',
      tipoTarjeta: '',
      tipoPersona: 'Fisica'
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
    const tipoPersona = this.tipoPersonaActual;
    const documentoLimpio = this.limpiarDocumento(this.nuevoCliente.cedula);

    if (!this.nuevoCliente.nombre?.trim()) {
      alert(tipoPersona === 'Juridica'
        ? 'La razón social es obligatoria.'
        : 'El nombre completo es obligatorio.');
      return;
    }

    if (!this.documentoValido(documentoLimpio, tipoPersona)) {
      alert(tipoPersona === 'Juridica'
        ? 'El RNC ingresado no es válido.'
        : 'La cédula ingresada no es válida.');
      return;
    }

    if (!this.cedulaEsValida) {
      alert(this.mensajeCedula || `Debes validar el ${this.nombreDocumento.toLowerCase()}.`);
      return;
    }

    if (Number(this.nuevoCliente.limiteCredito) < 0) {
      alert('El límite de crédito no puede ser negativo.');
      return;
    }

    if (this.tieneDatosTarjeta()) {
      if (!this.nuevoCliente.nombreTitularTarjeta?.trim()) {
        alert('El nombre del titular de la tarjeta es obligatorio.');
        return;
      }

      if (!this.numeroTarjetaValido()) {
        alert('El número de tarjeta no es válido.');
        return;
      }

      if (!this.fechaExpiracionValida(this.nuevoCliente.fechaExpiracionTarjeta)) {
        alert('La fecha de expiración no es válida o la tarjeta está vencida.');
        return;
      }

      if (!this.cvvValido()) {
        alert('El CVV debe contener 3 dígitos.');
        return;
      }
    }

    const numeroTarjetaLimpio = this.limpiarNumeroTarjeta(this.nuevoCliente.noTarjetaCr);

    const clienteEnviar: Cliente = {
      ...this.nuevoCliente,
      nombre: this.nuevoCliente.nombre.trim(),
      cedula: documentoLimpio,
      limiteCredito: Number(this.nuevoCliente.limiteCredito),
      tipoPersona,
      noTarjetaCr: numeroTarjetaLimpio || '',
      nombreTitularTarjeta: this.nuevoCliente.nombreTitularTarjeta?.trim() || '',
      fechaExpiracionTarjeta: this.nuevoCliente.fechaExpiracionTarjeta || '',
      tipoTarjeta: numeroTarjetaLimpio
        ? this.identificarTarjeta(numeroTarjetaLimpio)
        : ''
    };

    const operacion = this.modoEdicion
      ? this.clienteService.actualizarCliente(clienteEnviar)
      : this.clienteService.crearCliente(clienteEnviar);

    operacion.subscribe({
      next: () => {
        alert(this.modoEdicion
          ? 'Cliente actualizado correctamente.'
          : 'Cliente guardado correctamente.');
        this.cancelar();
        this.cargarClientes();
      },
      error: (err: any) => {
        console.error('Error al guardar cliente', err);
        alert(this.obtenerMensajeError(err, 'Ocurrió un error al guardar el cliente.'));
      }
    });
  }

  editar(cliente: Cliente): void {
    this.nuevoCliente = {
      ...cliente,
      cedula: this.formatearDocumento(cliente.cedula, cliente.tipoPersona),
      noTarjetaCr: this.formatearNumeroTarjeta(cliente.noTarjetaCr),
      nombreTitularTarjeta: cliente.nombreTitularTarjeta || '',
      fechaExpiracionTarjeta: cliente.fechaExpiracionTarjeta || '',
      tipoTarjeta: cliente.tipoTarjeta || this.identificarTarjeta(cliente.noTarjetaCr),
      tipoPersona: cliente.tipoPersona || 'Fisica'
    };

    this.cvvTemporal = '';
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.validarCedulaApi();
    this.cdr.detectChanges();
  }

  eliminar(id?: number): void {
    if (!id || !confirm('¿Desea eliminar este cliente?')) {
      return;
    }

    this.clienteService.eliminarCliente(id).subscribe({
      next: () => {
        alert('Cliente eliminado correctamente.');
        this.cargarClientes();
      },
      error: (err: any) => alert(
        this.obtenerMensajeError(
          err,
          'No se pudo eliminar el cliente. Puede estar relacionado con una renta.'
        )
      )
    });
  }

  cancelar(): void {
    this.nuevoCliente = this.crearClienteVacio();
    this.cvvTemporal = '';
    this.modoEdicion = false;
    this.mostrarFormulario = false;
    this.mensajeCedula = '';
    this.cedulaEsValida = false;
    this.validandoCedula = false;
    this.cdr.detectChanges();
  }

  get tipoPersonaActual(): string {
    return this.nuevoCliente.tipoPersona === 'Juridica' ? 'Juridica' : 'Fisica';
  }

  get nombreDocumento(): string {
    return this.tipoPersonaActual === 'Juridica' ? 'RNC' : 'Cédula';
  }

  get placeholderDocumento(): string {
    return this.tipoPersonaActual === 'Juridica'
      ? '000-00000-0'
      : '000-0000000-0';
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

  limpiarCedula(cedula: string): string {
    return (cedula || '').replace(/\D/g, '').slice(0, 11);
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

  formatearCedula(cedula: string): string {
    return this.formatearDocumento(cedula, 'Fisica');
  }

  onCedulaInput(): void {
    this.nuevoCliente.cedula = this.formatearDocumento(
      this.nuevoCliente.cedula,
      this.tipoPersonaActual
    );

    const documento = this.limpiarDocumento(this.nuevoCliente.cedula);
    const longitudEsperada = this.tipoPersonaActual === 'Juridica' ? 9 : 11;

    this.mensajeCedula = '';
    this.cedulaEsValida = false;

    if (!documento) return;

    if (documento.length < longitudEsperada) {
      this.mensajeCedula = `El ${this.nombreDocumento} debe tener ${longitudEsperada} dígitos.`;
      return;
    }

    this.validarCedulaApi();
  }

  validarCedulaApi(): void {
    const documento = this.limpiarDocumento(this.nuevoCliente.cedula);
    const longitudEsperada = this.tipoPersonaActual === 'Juridica' ? 9 : 11;

    this.mensajeCedula = '';
    this.cedulaEsValida = false;

    if (documento.length !== longitudEsperada) {
      this.mensajeCedula = `El ${this.nombreDocumento} debe tener ${longitudEsperada} dígitos.`;
      return;
    }

    this.validandoCedula = true;

    this.clienteService
      .validarDocumento(documento, this.tipoPersonaActual, this.nuevoCliente.id)
      .subscribe({
        next: (respuesta: any) => {
          this.cedulaEsValida = Boolean(respuesta.esValida);
          this.mensajeCedula = respuesta.mensaje;
          this.validandoCedula = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error validando documento', err);
          this.mensajeCedula = `No se pudo validar el ${this.nombreDocumento}.`;
          this.cedulaEsValida = false;
          this.validandoCedula = false;
          this.cdr.detectChanges();
        }
      });
  }

  documentoValido(documento: string, tipoPersona: string): boolean {
    return tipoPersona === 'Juridica'
      ? this.rncValido(documento)
      : this.cedulaValida(documento);
  }

  cedulaValida(cedula: string): boolean {
    cedula = (cedula || '').replace(/\D/g, '');
    if (cedula.length !== 11 || /^(\d)\1{10}$/.test(cedula)) return false;

    const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 10; i++) {
      let valor = Number(cedula[i]) * pesos[i];
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

    for (let i = 0; i < 8; i++) {
      suma += Number(rnc[i]) * pesos[i];
    }

    const resto = suma % 11;
    const digito = resto === 0 ? 2 : resto === 1 ? 1 : 11 - resto;
    return digito === Number(rnc[8]);
  }

  formatearCedulaListado(documento: string, tipoPersona?: string): string {
    return this.formatearDocumento(documento, tipoPersona);
  }

  onNumeroTarjetaInput(): void {
    const numeroLimpio = this.limpiarNumeroTarjeta(this.nuevoCliente.noTarjetaCr);
    const tipoTarjeta = this.identificarTarjeta(numeroLimpio);
    const longitudMaxima = tipoTarjeta === 'AMEX' ? 15 : 16;
    const numeroLimitado = numeroLimpio.slice(0, longitudMaxima);

    this.nuevoCliente.noTarjetaCr = tipoTarjeta === 'AMEX'
      ? this.formatearAmex(numeroLimitado)
      : this.formatearNumeroTarjeta(numeroLimitado);
    this.nuevoCliente.tipoTarjeta = this.identificarTarjeta(numeroLimitado);
  }

  onFechaExpiracionInput(): void {
    const numeros = (this.nuevoCliente.fechaExpiracionTarjeta || '')
      .replace(/\D/g, '')
      .slice(0, 4);

    this.nuevoCliente.fechaExpiracionTarjeta = numeros.length <= 2
      ? numeros
      : `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }

  onCvvInput(): void {
    this.cvvTemporal = (this.cvvTemporal || '').replace(/\D/g, '').slice(0, 3);
  }

  tieneDatosTarjeta(): boolean {
    return Boolean(
      this.nuevoCliente.noTarjetaCr ||
      this.nuevoCliente.nombreTitularTarjeta ||
      this.nuevoCliente.fechaExpiracionTarjeta ||
      this.cvvTemporal
    );
  }

  numeroTarjetaValido(): boolean {
    const numero = this.limpiarNumeroTarjeta(this.nuevoCliente.noTarjetaCr);
    const tipo = this.identificarTarjeta(numero);
    const longitudValida = tipo === 'AMEX'
      ? numero.length === 15
      : tipo === 'VISA'
        ? [13, 16, 19].includes(numero.length)
        : tipo === 'MASTERCARD'
          ? numero.length === 16
          : tipo === 'DISCOVER'
            ? [16, 19].includes(numero.length)
            : false;

    return longitudValida && this.cumpleAlgoritmoLuhn(numero);
  }

  fechaExpiracionValida(fecha: string | undefined): boolean {
    if (!fecha || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(fecha)) return false;
    const [mesTexto, anioTexto] = fecha.split('/');
    const mes = Number(mesTexto);
    const anio = 2000 + Number(anioTexto);
    return new Date(anio, mes, 0, 23, 59, 59) >= new Date();
  }

  cvvValido(): boolean {
    return /^\d{3}$/.test(this.cvvTemporal);
  }

  cumpleAlgoritmoLuhn(numero: string): boolean {
    let suma = 0;
    let duplicar = false;

    for (let i = numero.length - 1; i >= 0; i--) {
      let digito = Number(numero[i]);
      if (duplicar) {
        digito *= 2;
        if (digito > 9) digito -= 9;
      }
      suma += digito;
      duplicar = !duplicar;
    }

    return suma % 10 === 0;
  }

  limpiarNumeroTarjeta(numero: string | undefined): string {
    return (numero || '').replace(/\D/g, '');
  }

  formatearNumeroTarjeta(numero: string | undefined): string {
    return this.limpiarNumeroTarjeta(numero).match(/.{1,4}/g)?.join(' ') || '';
  }

  formatearAmex(numero: string): string {
    const limpio = numero.replace(/\D/g, '').slice(0, 15);
    return [limpio.slice(0, 4), limpio.slice(4, 10), limpio.slice(10, 15)]
      .filter(Boolean)
      .join(' ');
  }

  identificarTarjeta(numero: string | undefined): string {
    const limpio = this.limpiarNumeroTarjeta(numero);
    if (!limpio) return '';
    if (limpio.startsWith('4')) return 'VISA';
    if (/^5[1-5]/.test(limpio) || this.esMastercardSerieDos(limpio)) return 'MASTERCARD';
    if (/^3[47]/.test(limpio)) return 'AMEX';
    if (/^6/.test(limpio)) return 'DISCOVER';
    return 'Desconocida';
  }

  esMastercardSerieDos(numero: string): boolean {
    if (numero.length < 4) return false;
    const primerosCuatro = Number(numero.slice(0, 4));
    return primerosCuatro >= 2221 && primerosCuatro <= 2720;
  }

  obtenerLogoTarjeta(marca: string): string {
    const logos: Record<string, string> = {
      VISA: 'images/cards/visa.png',
      MASTERCARD: 'images/cards/mastercard.png',
      AMEX: 'images/cards/amex.png',
      DISCOVER: 'images/cards/discover.png'
    };
    return logos[marca] || '';
  }

  obtenerMensajeError(err: any, mensajePredeterminado: string): string {
    if (typeof err?.error === 'string') return err.error;
    if (err?.error?.message) return err.error.message;
    return mensajePredeterminado;
  }
}
