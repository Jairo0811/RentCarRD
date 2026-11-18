/** Contratos tipados de la API de RentCarRD v1.2.1 (respuestas en camelCase). */

export type EstadoVehiculo = 'Disponible' | 'Rentado' | 'NoDisponible';
export type EstadoRenta = 'Activa' | 'Concluida';
export type TipoPersona = 'Fisica' | 'Juridica';
export type MarcaTarjeta = 'VISA' | 'MASTERCARD' | 'AMEX' | 'DISCOVER';

export interface Catalogo {
  id?: number;
  descripcion: string;
  estado: boolean;
}

export interface Modelo extends Catalogo {
  idMarca: number | null;
}

export interface Cliente {
  id?: number;
  nombre: string;
  cedula: string;
  tipoPersona: TipoPersona;
  limiteCredito: number;
  estado: boolean;
  /** Método de pago SIMULADO: marca y 4 dígitos de referencia. Nunca un número completo. */
  tipoTarjeta: MarcaTarjeta | null;
  ultimosDigitosTarjeta: string | null;
}

export interface Empleado {
  id?: number;
  nombre: string;
  cedula: string;
  tandaLabor: string;
  porcientoComision: number;
  fechaIngreso: string;
  estado: boolean;
  usuario: string;
  rol?: 'Admin' | 'Empleado';
  /** Solo se envía al crear o cambiar la contraseña; la API nunca la devuelve. */
  password?: string;
}

export interface Vehiculo {
  id?: number;
  descripcion: string;
  noChasis: string | null;
  noMotor: string | null;
  noPlaca: string;
  idTipoVehiculo: number | null;
  idMarca: number | null;
  idModelo: number | null;
  idTipoCombustible: number | null;
  idCombustible?: number | null;
  estado?: boolean | null;
  estadoOperacion: EstadoVehiculo;
  imagenUrl?: string | null;
}

export interface Renta {
  noRenta: number;
  idEmpleado: number;
  nombreEmpleado: string;
  idVehiculo: number;
  idCliente: number;
  fechaRenta: string;
  /** Fecha prevista = fecha de renta + días contratados (calculada por la API). */
  fechaDevolucionPrevista: string;
  /** Fecha real de devolución; null mientras la renta está activa. */
  fechaDevolucion: string | null;
  montoXDia: number;
  cantidadDias: number;
  subtotal: number;
  itbis: number;
  total: number;
  comentario: string;
  estado: EstadoRenta;
}

/** Solicitud de renta: el empleado responsable lo determina la API a partir del JWT. */
export interface CrearRentaRequest {
  idVehiculo: number;
  idCliente: number;
  fechaRenta: string;
  montoXDia: number;
  cantidadDias: number;
  comentario: string;
}

export interface Inspeccion {
  idTransaccion?: number;
  idVehiculo: number | null;
  idCliente: number | null;
  tieneRalladuras: boolean;
  cantidadCombustible: string;
  tieneGomaRespuesta: boolean;
  tieneGato: boolean;
  tieneRoturasCristal: boolean;
  gomaDelanteraDerecha: boolean;
  gomaDelanteraIzquierda: boolean;
  gomaTraseraDerecha: boolean;
  gomaTraseraIzquierda: boolean;
  fecha: string;
  idEmpleadoInspeccion?: number;
  estado: boolean;
}

/** Estado operativo real, con compatibilidad para registros antiguos sin EstadoOperacion. */
export function estadoOperativo(vehiculo: Pick<Vehiculo, 'estadoOperacion' | 'estado'> | null | undefined): EstadoVehiculo {
  const estado = String(vehiculo?.estadoOperacion ?? '').replace(/\s/g, '');
  if (estado === 'Disponible' || estado === 'Rentado' || estado === 'NoDisponible') return estado;
  return vehiculo?.estado === true ? 'Disponible' : 'Rentado';
}
