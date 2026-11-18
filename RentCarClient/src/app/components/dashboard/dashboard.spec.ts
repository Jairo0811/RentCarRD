import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { DashboardComponent, indicadoresFlota, indicadoresRentas, porcentaje } from './dashboard';
import { cliente, renta, vehiculo } from '../../testing/datos';

describe('Indicadores del dashboard', () => {
  it('distingue disponibles, rentados y no disponibles por el estado operativo real', () => {
    const flota = indicadoresFlota([
      vehiculo(1),
      vehiculo(2, 'Rentado'),
      vehiculo(3, 'NoDisponible'),
      vehiculo(4, 'NoDisponible'),
      // Registro histórico sin EstadoOperacion: se deduce del booleano.
      { ...vehiculo(5), estadoOperacion: '' as never, estado: true },
    ]);
    expect(flota).toEqual({ total: 5, disponibles: 2, rentados: 1, noDisponibles: 2 });
  });

  it('un vehículo NoDisponible (estado=false) ya no se cuenta como rentado', () => {
    expect(indicadoresFlota([vehiculo(1, 'NoDisponible', { estado: false })]).rentados).toBe(0);
  });

  it('el importe contratado usa subtotal + ITBIS persistidos, no tarifa × días', () => {
    const r = indicadoresRentas([
      renta(1),
      renta(2, { estado: 'Concluida', montoXDia: 100.25, cantidadDias: 1, subtotal: 100.25, itbis: 18.05, total: 118.3 }),
    ]);
    expect(r.activas).toBe(1);
    expect(r.concluidas).toBe(1);
    expect(r.contratado).toEqual({ subtotal: 3100.25, itbis: 558.05, total: 3658.3 });
    expect(r.contratadoConcluidas.total).toBe(118.3);
  });

  it('porcentajes seguros con flota vacía', () => {
    expect(porcentaje(1, 0)).toBe(0);
    expect(porcentaje(1, 3)).toBe(33);
  });
});

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function responder(vehiculos: object[], rentas: object[]) {
    http.expectOne((r) => r.url.endsWith('/api/Vehiculos')).flush(vehiculos);
    http.expectOne((r) => r.url.endsWith('/api/Clientes')).flush([cliente(1)]);
    http.expectOne((r) => r.url.endsWith('/api/Rentas')).flush(rentas);
    http.expectOne((r) => r.url.endsWith('/api/Inspecciones')).flush([]);
    fixture.detectChanges();
  }

  it('presenta el indicador como importe contratado y no como ingresos cobrados', () => {
    responder([vehiculo(1), vehiculo(2, 'NoDisponible')], [renta(1)]);
    const texto = (fixture.nativeElement as HTMLElement).textContent!;
    expect(texto).toContain('Importe contratado');
    expect(texto).toContain('no registra cobros');
    expect(texto).not.toContain('Ingresos acumulados');
    expect(texto).toContain('No disponibles');
  });

  it('con base vacía muestra estados vacíos sin errores', () => {
    responder([], []);
    const texto = (fixture.nativeElement as HTMLElement).textContent!;
    expect(texto).toContain('No hay rentas registradas.');
    expect(texto).toContain('No hay vehículos registrados.');
    expect(texto).toContain('0% de la flota');
  });
});
