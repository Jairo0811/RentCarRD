import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { LoginComponent, mensajeLogin } from './login';
import { limpiarAlmacenes, tokenPara } from '../../testing/sesion';

describe('Login', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    limpiarAlmacenes();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });
  afterEach(() => {
    http.verify();
    limpiarAlmacenes();
  });

  const html = () => fixture.nativeElement as HTMLElement;

  it('campos con etiquetas asociadas, autocompletado y tarjeta sin ancho fijo', () => {
    expect(html().querySelector('label[for="login-usuario"]')).not.toBeNull();
    expect(html().querySelector('label[for="login-password"]')).not.toBeNull();
    expect(html().querySelector('#login-password')?.getAttribute('autocomplete')).toBe('current-password');
    expect(html().querySelector('.card')?.getAttribute('style') ?? '').not.toContain('width: 400px');
  });

  it('deshabilita el botón mientras procesa, no recorta la contraseña y redirige según el rol', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const c = fixture.componentInstance;
    c.usuario = '  ADMIN ';
    c.password = ' clave con espacios1 ';
    c.ingresar();
    fixture.detectChanges();

    expect(html().querySelector<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(true);
    c.ingresar(); // doble envío ignorado
    const req = http.expectOne((r) => r.url.endsWith('/api/auth/login'));
    expect(req.request.body).toEqual({ usuario: 'admin', password: ' clave con espacios1 ' });

    const { token, expira } = tokenPara('Admin', 1);
    req.flush({ accessToken: token, expiresAtUtc: expira, rol: 'Admin', empleadoId: 1, nombre: 'Admin' });
    expect(navegar).toHaveBeenCalledWith('/dashboard');
    expect(c.procesandoLogin).toBe(false);
  });

  it('muestra mensajes accesibles de error', () => {
    const c = fixture.componentInstance;
    c.usuario = 'ana';
    c.password = 'Incorrecta1';
    c.ingresar();
    http.expectOne((r) => r.url.endsWith('/api/auth/login')).flush({ mensaje: 'Credenciales incorrectas.' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    expect(html().querySelector('[role="alert"]')?.textContent).toContain('Usuario o contraseña incorrectos.');
  });

  it('traduce los códigos de error de autenticación', () => {
    expect(mensajeLogin(new HttpErrorResponse({ status: 0 }))).toContain('No se pudo conectar');
    expect(mensajeLogin(new HttpErrorResponse({ status: 429 }))).toContain('Demasiados intentos');
    expect(mensajeLogin(new Error('x'))).toContain('No se pudo iniciar sesión');
  });
});
