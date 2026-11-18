import { Cliente, Renta, Vehiculo } from '../interfaces/modelos';

export function vehiculo(id: number, estadoOperacion: Vehiculo['estadoOperacion'] = 'Disponible', extra: Partial<Vehiculo> = {}): Vehiculo {
  return {
    id,
    descripcion: `Vehículo ${id}`,
    noChasis: null,
    noMotor: null,
    noPlaca: `A00000${id}`.slice(-7),
    idTipoVehiculo: 1,
    idMarca: 1,
    idModelo: 1,
    idTipoCombustible: 1,
    estado: estadoOperacion === 'Disponible',
    estadoOperacion,
    imagenUrl: null,
    ...extra,
  };
}

export function cliente(id: number, extra: Partial<Cliente> = {}): Cliente {
  return {
    id,
    nombre: `Cliente ${id}`,
    cedula: '40212428508',
    tipoPersona: 'Fisica',
    limiteCredito: 50000,
    estado: true,
    tipoTarjeta: null,
    ultimosDigitosTarjeta: null,
    ...extra,
  };
}

export function renta(noRenta: number, extra: Partial<Renta> = {}): Renta {
  return {
    noRenta,
    idEmpleado: 7,
    nombreEmpleado: 'Empleado Responsable',
    idVehiculo: noRenta,
    idCliente: 1,
    fechaRenta: '2026-11-01T00:00:00',
    fechaDevolucionPrevista: '2026-11-04T00:00:00',
    fechaDevolucion: null,
    montoXDia: 1000,
    cantidadDias: 3,
    subtotal: 3000,
    itbis: 540,
    total: 3540,
    comentario: '',
    estado: 'Activa',
    ...extra,
  };
}
