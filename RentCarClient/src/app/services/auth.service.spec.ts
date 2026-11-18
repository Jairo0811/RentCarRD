import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService, CLAVES_SESION, decodificarPayload } from './auth.service';
import { CLAIM_ROL_MS, crearToken, guardarSesion, limpiarAlmacenes, tokenPara } from '../testing/sesion';

describe('AuthService', () => {
  let http: HttpTestingController;

  function crearServicio(): AuthService {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    return TestBed.inject(AuthService);
  }

  beforeEach(() => limpiarAlmacenes());
  afterEach(() => {
    http?.verify();
    limpiarAlmacenes();
  });

  it('guarda el JWT en sessionStorage y deriva rol y empleado del token firmado', () => {
    const auth = crearServicio();
    const { token, expira } = tokenPara('Empleado', 42);

    auth.login('ana', 'Clave2026').subscribe();
    const solicitud = http.expectOne((r) => r.url.endsWith('/api/auth/login'));
    expect(solicitud.request.body).toEqual({ usuario: 'ana', password: 'Clave2026' });
    solicitud.flush({ accessToken: token, expiresAtUtc: expira, rol: 'Empleado', empleadoId: 42, nombre: 'Ana' });

    expect(sessionStorage.getItem(CLAVES_SESION.token)).toBe(token);
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.rol()).toBe('empleado');
    expect(auth.esAdmin()).toBe(false);
    expect(auth.empleadoId()).toBe(42);
    expect(auth.nombre()).toBe('Ana');
    expect(auth.inicio()).toBe('/rentas');
    // Nada de identidad ni rol en localStorage (antes se usaba y era editable).
    expect(localStorage.length).toBe(0);
  });

  it('ignora valores de rol manipulados en localStorage', () => {
    localStorage.setItem('rolUsuario', 'admin');
    localStorage.setItem('idEmpleado', '1');
    guardarSesion('Empleado', 9);

    const auth = crearServicio();

    expect(auth.rol()).toBe('empleado');
    expect(auth.empleadoId()).toBe(9);
  });

  it('logout elimina el token, su expiración y solo las claves de RentCarRD', () => {
    guardarSesion('Admin', 1);
    sessionStorage.setItem('accessToken', 'token-v1.2');
    localStorage.setItem('rolUsuario', 'admin');
    localStorage.setItem('idEmpleado', '1');
    localStorage.setItem('nombreUsuario', 'Admin');
    localStorage.setItem('preferencia-de-otra-app', 'conservar');
    sessionStorage.setItem('otra-app', 'conservar');

    const auth = crearServicio();
    expect(auth.isAuthenticated()).toBe(true);
    auth.logout();

    expect(sessionStorage.getItem(CLAVES_SESION.token)).toBeNull();
    expect(sessionStorage.getItem(CLAVES_SESION.expira)).toBeNull();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('rolUsuario')).toBeNull();
    expect(localStorage.getItem('idEmpleado')).toBeNull();
    expect(localStorage.getItem('preferencia-de-otra-app')).toBe('conservar');
    expect(sessionStorage.getItem('otra-app')).toBe('conservar');
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.token()).toBeNull();
    expect(auth.rol()).toBeNull();
  });

  it('trata un token expirado como sesión cerrada y la limpia', () => {
    guardarSesion('Admin', 1, -5);
    const auth = crearServicio();

    expect(auth.token()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem(CLAVES_SESION.token)).toBeNull();
  });

  it('usa la expiración más temprana entre la respuesta y el claim exp', () => {
    const exp = Math.floor(Date.now() / 1000) - 60;
    sessionStorage.setItem(CLAVES_SESION.token, crearToken({ [CLAIM_ROL_MS]: 'Admin', empleado_id: '1', exp }));
    sessionStorage.setItem(CLAVES_SESION.expira, new Date(Date.now() + 3_600_000).toISOString());

    expect(crearServicio().isAuthenticated()).toBe(false);
  });

  it('rechaza tokens mal formados o con roles desconocidos', () => {
    sessionStorage.setItem(CLAVES_SESION.token, 'no-es-un-jwt');
    sessionStorage.setItem(CLAVES_SESION.expira, new Date(Date.now() + 60_000).toISOString());
    expect(crearServicio().isAuthenticated()).toBe(false);

    TestBed.resetTestingModule();
    sessionStorage.setItem(CLAVES_SESION.token, crearToken({ role: 'SuperUsuario', exp: Date.now() / 1000 + 600 }));
    expect(crearServicio().rol()).toBeNull();
  });

  it('decodifica payloads base64url con caracteres no ASCII', () => {
    const token = crearToken({ nombre: 'José Ñúñez' });
    expect(decodificarPayload(token)?.['nombre']).toBe('José Ñúñez');
    expect(decodificarPayload('a.b')).toBeNull();
  });
});
