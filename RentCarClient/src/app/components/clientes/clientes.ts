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
      error: (err: any) => {
        console.error('Error al cargar clientes', err);
      }
    });
  }

  guardarCliente(): void {
    if (!this.nuevoCliente.nombre?.trim() || !this.nuevoCliente.cedula) {
      alert('Por favor, completa el nombre y la cédula.');
      return;
    }

    if (Number(this.nuevoCliente.limiteCredito) < 0) {
      alert('El límite de crédito no puede ser negativo.');
      return;
    }

    const cedulaLimpia = this.limpiarCedula(this.nuevoCliente.cedula);

    if (!this.cedulaValida(cedulaLimpia)) {
      alert('La cédula ingresada no es válida.');
      return;
    }

    if (!this.cedulaEsValida) {
      alert(this.mensajeCedula || 'Debes validar una cédula válida y disponible.');
      return;
    }

    const tieneDatosTarjeta = this.tieneDatosTarjeta();

    if (tieneDatosTarjeta) {
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

    const numeroTarjetaLimpio = this.limpiarNumeroTarjeta(
      this.nuevoCliente.noTarjetaCr
    );

    const clienteEnviar: Cliente = {
      ...this.nuevoCliente,
      nombre: this.nuevoCliente.nombre.trim(),
      cedula: cedulaLimpia,
      limiteCredito: Number(this.nuevoCliente.limiteCredito),
      tipoPersona: this.nuevoCliente.tipoPersona || 'Fisica',
      noTarjetaCr: numeroTarjetaLimpio || '',
      nombreTitularTarjeta:
        this.nuevoCliente.nombreTitularTarjeta?.trim() || '',
      fechaExpiracionTarjeta:
        this.nuevoCliente.fechaExpiracionTarjeta || '',
      tipoTarjeta: numeroTarjetaLimpio
        ? this.identificarTarjeta(numeroTarjetaLimpio)
        : ''
    };

    if (this.modoEdicion) {
      this.clienteService.actualizarCliente(clienteEnviar).subscribe({
        next: () => {
          alert('Cliente actualizado correctamente.');
          this.cancelar();
          this.cargarClientes();
        },
        error: (err: any) => {
          console.error('Error al actualizar', err);
          alert(this.obtenerMensajeError(err, 'Ocurrió un error al actualizar el cliente.'));
        }
      });

      return;
    }

    this.clienteService.crearCliente(clienteEnviar).subscribe({
      next: () => {
        alert('Cliente guardado correctamente.');
        this.cancelar();
        this.cargarClientes();
      },
      error: (err: any) => {
        console.error('Error al guardar', err);
        alert(this.obtenerMensajeError(err, 'Ocurrió un error al guardar el cliente.'));
      }
    });
  }

  editar(cliente: Cliente): void {
    this.nuevoCliente = {
      ...cliente,
      cedula: this.formatearCedula(cliente.cedula),
      noTarjetaCr: this.formatearNumeroTarjeta(cliente.noTarjetaCr),
      nombreTitularTarjeta: cliente.nombreTitularTarjeta || '',
      fechaExpiracionTarjeta: cliente.fechaExpiracionTarjeta || '',
      tipoTarjeta:
        cliente.tipoTarjeta ||
        this.identificarTarjeta(cliente.noTarjetaCr),
      tipoPersona: cliente.tipoPersona || 'Fisica'
    };

    this.cvvTemporal = '';
    this.modoEdicion = true;
    this.mostrarFormulario = true;

    this.validarCedulaApi();
    this.cdr.detectChanges();
  }

  eliminar(id?: number): void {
    if (!id) {
      return;
    }

    if (!confirm('¿Desea eliminar este cliente?')) {
      return;
    }

    this.clienteService.eliminarCliente(id).subscribe({
      next: () => {
        alert('Cliente eliminado correctamente.');
        this.cargarClientes();
      },
      error: (err: any) => {
        console.error('Error al eliminar', err);
        alert(
          this.obtenerMensajeError(
            err,
            'No se pudo eliminar el cliente. Puede estar relacionado con una renta.'
          )
        );
      }
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

  limpiarCedula(cedula: string): string {
    return (cedula || '').replace(/\D/g, '').slice(0, 11);
  }

  formatearCedula(cedula: string): string {
    const limpia = this.limpiarCedula(cedula);

    if (limpia.length <= 3) {
      return limpia;
    }

    if (limpia.length <= 10) {
      return `${limpia.slice(0, 3)}-${limpia.slice(3)}`;
    }

    return `${limpia.slice(0, 3)}-${limpia.slice(3, 10)}-${limpia.slice(10, 11)}`;
  }

  onCedulaInput(): void {
    this.nuevoCliente.cedula = this.formatearCedula(
      this.nuevoCliente.cedula
    );

    const cedulaLimpia = this.limpiarCedula(
      this.nuevoCliente.cedula
    );

    this.mensajeCedula = '';
    this.cedulaEsValida = false;

    if (cedulaLimpia.length === 0) {
      return;
    }

    if (cedulaLimpia.length < 11) {
      this.mensajeCedula = 'La cédula debe tener 11 dígitos.';
      return;
    }

    this.validarCedulaApi();
  }

  validarCedulaApi(): void {
    const cedula = this.limpiarCedula(this.nuevoCliente.cedula);

    this.mensajeCedula = '';
    this.cedulaEsValida = false;

    if (cedula.length !== 11) {
      this.mensajeCedula = 'La cédula debe tener 11 dígitos.';
      return;
    }

    this.validandoCedula = true;

    this.clienteService
      .validarCedula(cedula, this.nuevoCliente.id)
      .subscribe({
        next: (respuesta: any) => {
          this.cedulaEsValida = Boolean(respuesta.esValida);
          this.mensajeCedula = respuesta.mensaje;
          this.validandoCedula = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error validando cédula', err);
          this.mensajeCedula = 'No se pudo validar la cédula.';
          this.cedulaEsValida = false;
          this.validandoCedula = false;
          this.cdr.detectChanges();
        }
      });
  }

  cedulaValida(cedula: string): boolean {
    cedula = this.limpiarCedula(cedula);

    if (cedula.length !== 11) {
      return false;
    }

    if (/^(\d)\1{10}$/.test(cedula)) {
      return false;
    }

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

  formatearCedulaListado(cedula: string): string {
    return this.formatearCedula(cedula);
  }

  onNumeroTarjetaInput(): void {
    const numeroLimpio = this.limpiarNumeroTarjeta(
      this.nuevoCliente.noTarjetaCr
    );

    const tipoTarjeta = this.identificarTarjeta(numeroLimpio);
    const longitudMaxima = tipoTarjeta === 'AMEX' ? 15 : 16;

    const numeroLimitado = numeroLimpio.slice(0, longitudMaxima);

    this.nuevoCliente.noTarjetaCr =
      tipoTarjeta === 'AMEX'
        ? this.formatearAmex(numeroLimitado)
        : this.formatearNumeroTarjeta(numeroLimitado);

    this.nuevoCliente.tipoTarjeta =
      this.identificarTarjeta(numeroLimitado);
  }

  onFechaExpiracionInput(): void {
    const numeros = (
      this.nuevoCliente.fechaExpiracionTarjeta || ''
    )
      .replace(/\D/g, '')
      .slice(0, 4);

    if (numeros.length <= 2) {
      this.nuevoCliente.fechaExpiracionTarjeta = numeros;
      return;
    }

    this.nuevoCliente.fechaExpiracionTarjeta =
      `${numeros.slice(0, 2)}/${numeros.slice(2)}`;
  }

  onCvvInput(): void {
    this.cvvTemporal = (this.cvvTemporal || '')
      .replace(/\D/g, '')
      .slice(0, 3);
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
    const numero = this.limpiarNumeroTarjeta(
      this.nuevoCliente.noTarjetaCr
    );

    const tipo = this.identificarTarjeta(numero);

    const longitudValida = (() => {
      switch (tipo) {
        case 'AMEX':
          return numero.length === 15;

        case 'VISA':
          return [13, 16, 19].includes(numero.length);

        case 'MASTERCARD':
          return numero.length === 16;

        case 'DISCOVER':
          return [16, 19].includes(numero.length);

        default:
          return false;
      }
    })();

    return longitudValida && this.cumpleAlgoritmoLuhn(numero);
  }

  fechaExpiracionValida(fecha: string | undefined): boolean {
    if (!fecha || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(fecha)) {
      return false;
    }

    const [mesTexto, anioTexto] = fecha.split('/');

    const mes = Number(mesTexto);
    const anio = 2000 + Number(anioTexto);

    const ultimoDiaMes = new Date(
      anio,
      mes,
      0,
      23,
      59,
      59
    );

    return ultimoDiaMes >= new Date();
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

        if (digito > 9) {
          digito -= 9;
        }
      }

      suma += digito;
      duplicar = !duplicar;
    }

    return suma % 10 === 0;
  }

  limpiarNumeroTarjeta(numero: string | undefined): string {
    return (numero || '').replace(/\D/g, '');
  }

  formatearNumeroTarjeta(
    numero: string | undefined
  ): string {
    const limpio = this.limpiarNumeroTarjeta(numero);

    return limpio.match(/.{1,4}/g)?.join(' ') || '';
  }

  formatearAmex(numero: string): string {
    const limpio = numero.replace(/\D/g, '').slice(0, 15);

    const parte1 = limpio.slice(0, 4);
    const parte2 = limpio.slice(4, 10);
    const parte3 = limpio.slice(10, 15);

    return [parte1, parte2, parte3]
      .filter(Boolean)
      .join(' ');
  }

  identificarTarjeta(
    numero: string | undefined
  ): string {
    const numLimpio = this.limpiarNumeroTarjeta(numero);

    if (!numLimpio) {
      return '';
    }

    if (numLimpio.startsWith('4')) {
      return 'VISA';
    }

    if (
      /^5[1-5]/.test(numLimpio) ||
      this.esMastercardSerieDos(numLimpio)
    ) {
      return 'MASTERCARD';
    }

    if (/^3[47]/.test(numLimpio)) {
      return 'AMEX';
    }

    if (/^6/.test(numLimpio)) {
      return 'DISCOVER';
    }

    return 'Desconocida';
  }

  esMastercardSerieDos(numero: string): boolean {
    if (numero.length < 4) {
      return false;
    }

    const primerosCuatro = Number(numero.slice(0, 4));

    return primerosCuatro >= 2221 && primerosCuatro <= 2720;
  }

  obtenerLogoTarjeta(marca: string): string {
    switch (marca) {
      case 'VISA':
        return 'images/cards/visa.png';

      case 'MASTERCARD':
        return 'images/cards/mastercard.png';

      case 'AMEX':
        return 'images/cards/amex.png';

      case 'DISCOVER':
        return 'images/cards/discover.png';

      default:
        return '';
    }
  }

 

  obtenerMensajeError(
    err: any,
    mensajePredeterminado: string
  ): string {
    if (typeof err?.error === 'string') {
      return err.error;
    }

    if (err?.error?.message) {
      return err.error.message;
    }

    return mensajePredeterminado;
  }
}