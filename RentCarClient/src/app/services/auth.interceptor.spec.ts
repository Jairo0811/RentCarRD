import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { authInterceptor, esSolicitudApi } from './auth.interceptor';
import { AuthService, CLAVES_SESION } from './auth.service';
import { environment } from '../../environments/environment';
import { guardarSesion, limpiarAlmacenes } from '../testing/sesion';

describe('esSolicitudApi', () => {
  it('con apiBaseUrl absoluto solo acepta ese origen bajo /api/', () => {
    const base = 'https://localhost:7162';
    expect(esSolicitudApi('https://localhost:7162/api/Rentas', base)).toBe(true);
    expect(esSolicitudApi('https://localhost:7162/vehiculos/foto.png', base)).toBe(false);
    expect(esSolicitudApi('https://evil.example/api/Rentas', base)).toBe(false);
    expect(esSolicitudApi('https://localhost:7162.evil.example/api/Rentas', base)).toBe(false);
    expect(esSolicitudApi('http://localhost:7162/api/Rentas', base)).toBe(false);
    expect(esSolicitudApi('/api/Rentas', base)).toBe(false);
  });

  it('con apiBaseUrl vacío (mismo origen) acepta rutas relativas /api/ y rechaza terceros', () => {
    expect(esSolicitudApi('/api/Rentas', '')).toBe(true);
    expect(esSolicitudApi(`${location.origin}/api/Clientes`, '')).toBe(true);
    expect(esSolicitudApi('images/logo-rentcarrd.png', '')).toBe(false);
    expect(esSolicitudApi('https://cdn.example/api/x', '')).toBe(false);
    expect(esSolicitudApi('//evil.example/api/x', '')).toBe(false);
  });
});

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: Router;
  const api = `${environment.apiBaseUrl}/api`;

  beforeEach(() => {
    limpiarAlmacenes();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(withInterceptors([authInterceptor])), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    backend.verify();
    limpiarAlmacenes();
  });

  it('adjunta el JWT solo a la API de RentCarRD', () => {
    const token = guardarSesion('Admin', 1);

    http.get(`${api}/Rentas`).subscribe();
    http.get('https://terceros.example/datos').subscribe();
    http.get('images/logo-rentcarrd.png').subscribe();

    expect(backend.expectOne(`${api}/Rentas`).request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    expect(backend.expectOne('https://terceros.example/datos').request.headers.has('Authorization')).toBe(false);
    expect(backend.expectOne('images/logo-rentcarrd.png').request.headers.has('Authorization')).toBe(false);
  });

  it('no envía un token expirado', () => {
    guardarSesion('Admin', 1, -1);
    http.get(`${api}/Rentas`).subscribe();
    expect(backend.expectOne(`${api}/Rentas`).request.headers.has('Authorization')).toBe(false);
  });

  it('401 de la API cierra la sesión y navega a /login una sola vez', () => {
    guardarSesion('Empleado', 3);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const errores: number[] = [];

    http.get(`${api}/Rentas`).subscribe({ error: (e) => errores.push(e.status) });
    backend.expectOne(`${api}/Rentas`).flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(errores).toEqual([401]);
    expect(sessionStorage.getItem(CLAVES_SESION.token)).toBeNull();
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(navegar).toHaveBeenCalledTimes(1);
    expect(navegar).toHaveBeenCalledWith(['/login'], { queryParams: { motivo: 'sesion' } });
  });

  it('401 del propio login no redirige (credenciales incorrectas)', () => {
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    http.post(`${api}/auth/login`, {}).subscribe({ error: () => undefined });
    backend.expectOne(`${api}/auth/login`).flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(navegar).not.toHaveBeenCalled();
  });

  it('403 conserva la sesión: el usuario está autenticado pero sin permiso', () => {
    guardarSesion('Empleado', 3);
    const navegar = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const errores: number[] = [];

    http.get(`${api}/Empleados`).subscribe({ error: (e) => errores.push(e.status) });
    backend.expectOne(`${api}/Empleados`).flush(null, { status: 403, statusText: 'Forbidden' });

    expect(errores).toEqual([403]);
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    expect(navegar).not.toHaveBeenCalled();
  });
});
