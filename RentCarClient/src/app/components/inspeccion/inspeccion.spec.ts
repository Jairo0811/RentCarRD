import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import Swal from 'sweetalert2';
import { InspeccionComponent } from './inspeccion';
import { InspeccionService } from '../../services/inspeccion.service';
import { guardarSesion, limpiarAlmacenes } from '../../testing/sesion';
import { cliente, vehiculo } from '../../testing/datos';

describe('Inspección de flota', () => {
  let fixture: ComponentFixture<InspeccionComponent>;
  let http: HttpTestingController;
  let fire: ReturnType<typeof vi.spyOn>;

  async function crear() {
    await TestBed.configureTestingModule({
      imports: [InspeccionComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(InspeccionComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  }

  beforeEach(() => {
    limpiarAlmacenes();
    fire = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false } as never);
  });
  afterEach(() => {
    http.verify();
    fire.mockRestore();
    limpiarAlmacenes();
  });

  it('para Admin envía los neumáticos con los nombres que espera la API y sin inspector', async () => {
    guardarSesion('Admin', 1);
    await crear();
    http.expectOne((r) => r.url.endsWith('/api/Inspecciones')).flush([]);
    http.expectOne((r) => r.url.endsWith('/api/Vehiculos')).flush([vehiculo(1)]);
    http.expectOne((r) => r.url.endsWith('/api/Clientes')).flush([cliente(1)]);

    const c = fixture.componentInstance;
    c.inspeccionActual = { ...c.resetForm(), idVehiculo: 1, idCliente: 1, cantidadCombustible: 'Lleno', gomaTraseraIzquierda: false };
    c.guardarInspeccion();

    const post = http.expectOne((r) => r.method === 'POST');
    expect(post.request.body).toMatchObject({
      gomaDelanteraDerecha: true,
      gomaDelanteraIzquierda: true,
      gomaTraseraDerecha: true,
      gomaTraseraIzquierda: false,
      cantidadCombustible: 'Lleno',
    });
    expect(post.request.body).not.toHaveProperty('estadoGomasDD');
    expect(post.request.body).not.toHaveProperty('idEmpleadoInspeccion');
    expect(post.request.body.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    post.flush({});
    ['Inspecciones', 'Vehiculos', 'Clientes'].forEach((r) => http.expectOne((x) => x.url.endsWith(`/api/${r}`)).flush([]));
  });

  it('para Empleado muestra acceso restringido y no consulta la API', async () => {
    guardarSesion('Empleado', 2);
    await crear();
    http.expectNone(() => true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Acceso restringido');
  });

  it('el servicio nunca envía idTransaccion ni idEmpleadoInspeccion en el cuerpo', () => {
    const cuerpo = InspeccionService.cuerpo({ idTransaccion: 5, idEmpleadoInspeccion: 1 } as never);
    expect(cuerpo).not.toHaveProperty('idTransaccion');
    expect(cuerpo).not.toHaveProperty('idEmpleadoInspeccion');
  });
});
