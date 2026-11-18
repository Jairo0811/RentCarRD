import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import Swal from 'sweetalert2';
import { ClientesComponent } from './clientes';
import { ClienteService } from '../../services/cliente.service';
import { cliente } from '../../testing/datos';

describe('Clientes (método de pago simulado)', () => {
  let fixture: ComponentFixture<ClientesComponent>;
  let componente: ClientesComponent;
  let http: HttpTestingController;
  let fire: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    fire = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false } as never);
    await TestBed.configureTestingModule({
      imports: [ClientesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ClientesComponent);
    componente = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/api/Clientes')).flush([cliente(1, { tipoTarjeta: 'VISA', ultimosDigitosTarjeta: '4242' })]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    fire.mockRestore();
  });

  const html = () => fixture.nativeElement as HTMLElement;

  it('el formulario no solicita número completo, titular, expiración ni CVV', () => {
    componente.abrirFormulario();
    fixture.detectChanges();

    const campos = Array.from(html().querySelectorAll('input, select, textarea'));
    const descripcion = [
      ...campos.map((c) => `${c.getAttribute('name')} ${c.id} ${c.getAttribute('placeholder') ?? ''}`),
      ...Array.from(html().querySelectorAll('label')).map((l) => l.textContent ?? ''),
    ].join(' ').toLowerCase();
    for (const prohibido of ['cvv', 'titular', 'expir', 'notarjeta', 'número de tarjeta', '0000 0000']) {
      expect(descripcion).not.toContain(prohibido);
    }
    expect(html().querySelector('input[type="password"]')).toBeNull();
    // El texto de ayuda advierte explícitamente que no se usen datos reales.
    expect(html().textContent).toContain('No introduzca datos de tarjetas reales');
    const digitos = html().querySelector<HTMLInputElement>('#cliente-digitos')!;
    expect(digitos.maxLength).toBe(4);
    expect(html().querySelector('label[for="cliente-digitos"]')).not.toBeNull();
  });

  it('el campo de referencia no admite más de 4 dígitos', () => {
    componente.nuevoCliente.ultimosDigitosTarjeta = '4111 1111 1111 1111';
    componente.onUltimosDigitosInput();
    expect(componente.nuevoCliente.ultimosDigitosTarjeta).toBe('4111');
  });

  it('valida la combinación marca + 4 dígitos', () => {
    componente.nuevoCliente.tipoTarjeta = 'VISA';
    componente.nuevoCliente.ultimosDigitosTarjeta = '12';
    expect(componente.validarMetodoPago()).toMatch(/4 dígitos/);
    componente.nuevoCliente.ultimosDigitosTarjeta = '1234';
    expect(componente.validarMetodoPago()).toBeNull();
    componente.nuevoCliente.tipoTarjeta = null;
    expect(componente.validarMetodoPago()).toMatch(/marca/);
    componente.nuevoCliente.ultimosDigitosTarjeta = null;
    expect(componente.validarMetodoPago()).toBeNull();
  });

  it('el listado solo muestra la terminación de 4 dígitos', () => {
    expect(html().textContent).toContain('•••• 4242');
  });

  it('el cuerpo enviado a la API es una lista blanca sin datos de tarjeta completos', () => {
    const cuerpo = ClienteService.cuerpo({
      ...cliente(1, { tipoTarjeta: 'MASTERCARD', ultimosDigitosTarjeta: '5555' }),
      // Restos de versiones anteriores que nunca deben viajar:
      ...({ noTarjetaCr: '5555555555554444', nombreTitularTarjeta: 'Ana', fechaExpiracionTarjeta: '12/29', cvv: '123' } as object),
    } as never);
    expect(Object.keys(cuerpo).sort()).toEqual(['cedula', 'estado', 'limiteCredito', 'nombre', 'tipoPersona', 'tipoTarjeta', 'ultimosDigitosTarjeta']);
    expect(JSON.stringify(cuerpo)).not.toContain('5555555555554444');
  });

  it('valida el documento con la API y guarda con el documento sin guiones', () => {
    componente.abrirFormulario();
    componente.nuevoCliente.nombre = '  Ana Pérez ';
    componente.nuevoCliente.cedula = '40212428508';
    componente.onCedulaInput();
    expect(componente.nuevoCliente.cedula).toBe('402-1242850-8');
    http.expectOne((r) => r.url.includes('/validar-documento/40212428508')).flush({ esValida: true, mensaje: 'Cédula válida y disponible para registrar.' });

    componente.guardarCliente();
    const post = http.expectOne((r) => r.method === 'POST');
    expect(post.request.body).toMatchObject({ nombre: 'Ana Pérez', cedula: '40212428508', tipoTarjeta: null, ultimosDigitosTarjeta: null });
    componente.guardarCliente(); // doble clic
    http.expectNone((r) => r.method === 'POST');
    post.flush(cliente(2));
    http.expectOne((r) => r.method === 'GET' && r.url.endsWith('/api/Clientes')).flush([]);
  });

  it('pide confirmación antes de eliminar', async () => {
    fire.mockResolvedValueOnce({ isConfirmed: false, isDenied: false, isDismissed: true } as never);
    await componente.eliminar(componente.clientes[0]);
    http.expectNone((r) => r.method === 'DELETE');

    await componente.eliminar(componente.clientes[0]);
    http.expectOne((r) => r.method === 'DELETE' && r.url.endsWith('/api/Clientes/1')).flush(null);
    http.expectOne((r) => r.method === 'GET').flush([]);
  });
});
