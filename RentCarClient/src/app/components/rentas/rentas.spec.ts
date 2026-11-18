import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import Swal from 'sweetalert2';
import { Rentas } from './rentas';
import { cliente, renta, vehiculo } from '../../testing/datos';
import { fechaLocalISO } from '../../shared/fechas';

describe('Rentas', () => {
  let fixture: ComponentFixture<Rentas>;
  let componente: Rentas;
  let http: HttpTestingController;
  let fire: ReturnType<typeof vi.spyOn>;

  const responder = (fragmento: string, cuerpo: object) =>
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith(fragmento)).flush(cuerpo);

  function cargar(datos = {
    rentas: [renta(1, { idVehiculo: 1 })],
    vehiculos: [vehiculo(1, 'Rentado'), vehiculo(2), vehiculo(3, 'NoDisponible'), vehiculo(4)],
    clientes: [cliente(1), cliente(2, { estado: false })],
  }) {
    fixture.detectChanges();
    responder('/api/Rentas', datos.rentas);
    responder('/api/Vehiculos', datos.vehiculos);
    responder('/api/Clientes', datos.clientes);
    responder('/api/Marcas', [{ id: 1, descripcion: 'Toyota', estado: true }]);
    responder('/api/Modelos', [{ id: 1, idMarca: 1, descripcion: 'Corolla', estado: true }]);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    fire = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false } as never);
    await TestBed.configureTestingModule({
      imports: [Rentas],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Rentas);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    fire.mockRestore();
  });

  it('carga sin consultar el listado administrativo de empleados (evita 403 para Empleado)', () => {
    cargar();
    http.expectNone((r) => r.url.includes('/api/Empleados'));
    expect(componente.cargando).toBe(false);
    expect(componente.errorCarga).toBe('');
  });

  it('solo ofrece vehículos disponibles y nunca rentados, y clientes activos', () => {
    cargar({
      rentas: [renta(1, { idVehiculo: 4, estado: 'Concluida' })],
      vehiculos: [vehiculo(1, 'Rentado'), vehiculo(2), vehiculo(3, 'NoDisponible'), vehiculo(4)],
      clientes: [cliente(1), cliente(2, { estado: false })],
    });
    expect(componente.vehiculosDisponibles.map((v) => v.id)).toEqual([2]);
    expect(componente.clientesActivos.map((c) => c.id)).toEqual([1]);
  });

  it('la fecha por defecto es la fecha local de hoy', () => {
    expect(componente.crearRentaVacia().fechaRenta).toBe(fechaLocalISO());
  });

  it('registra la renta sin idEmpleado ni importes (los calcula y atribuye la API)', () => {
    cargar();
    componente.abrirFormulario();
    componente.nuevaRenta = { idVehiculo: 2, idCliente: 1, fechaRenta: '2026-11-17', montoXDia: 2500.5, cantidadDias: 2, comentario: '  Entrega  ' };
    expect(componente.desgloseFormulario).toEqual({ subtotal: 5001, itbis: 900.18, total: 5901.18 });

    componente.guardarRenta();
    const solicitud = http.expectOne((r) => r.method === 'POST' && r.url.endsWith('/api/Rentas'));
    expect(solicitud.request.body).toEqual({ idVehiculo: 2, idCliente: 1, fechaRenta: '2026-11-17', montoXDia: 2500.5, cantidadDias: 2, comentario: 'Entrega' });
    expect(solicitud.request.body).not.toHaveProperty('idEmpleado');

    // Doble clic mientras la solicitud está en curso: no se envía otra.
    componente.guardarRenta();
    http.expectNone((r) => r.method === 'POST');

    solicitud.flush(renta(9, { idVehiculo: 2 }));
    expect(componente.guardando).toBe(false);
    cargarRecarga();
  });

  it('valida tarifa, días y vehículo antes de enviar', () => {
    cargar();
    const casos: [Partial<Rentas['nuevaRenta']>, RegExp][] = [
      [{ idVehiculo: null }, /vehículo y un cliente/],
      [{ montoXDia: 0 }, /tarifa/],
      [{ cantidadDias: 0 }, /días/],
      [{ cantidadDias: 366 }, /días/],
      [{ cantidadDias: 1.5 }, /días/],
      [{ idVehiculo: 3 }, /ya no está disponible/],
    ];
    for (const [cambio, mensaje] of casos) {
      componente.nuevaRenta = { idVehiculo: 2, idCliente: 1, fechaRenta: '2026-11-17', montoXDia: 100, cantidadDias: 1, comentario: '', ...cambio };
      expect(componente.validarFormulario()).toMatch(mensaje);
    }
    componente.nuevaRenta = { idVehiculo: 2, idCliente: 1, fechaRenta: '2026-11-17', montoXDia: 100, cantidadDias: 1, comentario: '' };
    expect(componente.validarFormulario()).toBeNull();
  });

  it('muestra el mensaje del backend y recarga la disponibilidad si la renta es rechazada (409)', async () => {
    cargar();
    componente.nuevaRenta = { idVehiculo: 2, idCliente: 1, fechaRenta: '2026-11-17', montoXDia: 100, cantidadDias: 1, comentario: '' };
    componente.guardarRenta();
    http.expectOne((r) => r.method === 'POST').flush('Este vehículo se encuentra rentado actualmente.', { status: 409, statusText: 'Conflict' });

    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'Este vehículo se encuentra rentado actualmente.' }));
    cargarRecarga();
  });

  it('procesa la devolución tras confirmar y evita el doble procesamiento', async () => {
    cargar();
    const activa = componente.rentas[0];

    const primera = componente.devolverVehiculo(activa);
    const segunda = componente.devolverVehiculo(activa);
    await Promise.all([primera, segunda]);

    const solicitudes: TestRequest[] = http.match((r) => r.method === 'PUT' && r.url.endsWith('/api/Rentas/1/devolucion'));
    expect(solicitudes.length).toBe(1);
    expect(componente.procesando.has(1)).toBe(true);
    solicitudes[0].flush({ mensaje: 'ok', noRenta: 1, estado: 'Concluida', fechaDevolucion: '2026-11-17T00:00:00', fechaDevolucionPrevista: '2026-11-04T00:00:00', subtotal: 3000, itbis: 540, total: 3540, idVehiculo: 1, estadoVehiculo: 'NoDisponible' });
    expect(componente.procesando.has(1)).toBe(false);
    cargarRecarga();
  });

  it('no envía la devolución si el usuario cancela la confirmación', async () => {
    cargar();
    fire.mockResolvedValueOnce({ isConfirmed: false, isDenied: false, isDismissed: true } as never);
    await componente.devolverVehiculo(componente.rentas[0]);
    http.expectNone((r) => r.method === 'PUT');
  });

  it('una renta concluida no se puede devolver otra vez desde la interfaz', async () => {
    cargar({ rentas: [renta(5, { estado: 'Concluida', fechaDevolucion: '2026-11-05T00:00:00' })], vehiculos: [], clientes: [] });
    await componente.devolverVehiculo(componente.rentas[0]);
    http.expectNone((r) => r.method === 'PUT');
    expect(fire).toHaveBeenCalledWith(expect.objectContaining({ text: 'Esta renta ya fue concluida.' }));
  });

  it('muestra estado de error con opción de reintentar cuando la carga falla', () => {
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/api/Rentas')).flush(null, { status: 500, statusText: 'Error' });
    http.match(() => true); // forkJoin abandona el resto de solicitudes tras el error
    fixture.detectChanges();
    expect(componente.errorCarga).not.toBe('');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent).toContain('Reintentar');
  });

  function cargarRecarga() {
    responder('/api/Rentas', []);
    responder('/api/Vehiculos', []);
    responder('/api/Clientes', []);
    responder('/api/Marcas', []);
    responder('/api/Modelos', []);
  }
});
