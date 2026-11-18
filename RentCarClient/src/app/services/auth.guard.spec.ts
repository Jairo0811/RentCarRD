import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { authGuard, inicioGuard, loginGuard } from './auth.guard';
import { guardarSesion, limpiarAlmacenes } from '../testing/sesion';

function ruta(roles?: string[]): ActivatedRouteSnapshot {
  return { data: roles ? { roles } : {} } as unknown as ActivatedRouteSnapshot;
}

function ejecutar(guard: typeof authGuard, roles?: string[]): boolean | UrlTree {
  return TestBed.runInInjectionContext(() => guard(ruta(roles), {} as RouterStateSnapshot)) as boolean | UrlTree;
}

function destino(resultado: boolean | UrlTree): string | boolean {
  return resultado instanceof UrlTree ? TestBed.inject(Router).serializeUrl(resultado) : resultado;
}

describe('Guards de navegación', () => {
  beforeEach(() => {
    limpiarAlmacenes();
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient()] });
  });
  afterEach(() => limpiarAlmacenes());

  it('sin sesión redirige a /login', () => {
    expect(destino(ejecutar(authGuard, ['admin']))).toBe('/login');
  });

  it('con sesión expirada redirige a /login', () => {
    guardarSesion('Admin', 1, -1);
    expect(destino(ejecutar(authGuard))).toBe('/login');
  });

  it('Empleado no entra a rutas administrativas y vuelve a su inicio', () => {
    guardarSesion('Empleado', 5);
    expect(destino(ejecutar(authGuard, ['admin']))).toBe('/rentas');
    expect(destino(ejecutar(authGuard, ['admin', 'empleado']))).toBe(true);
  });

  it('Admin entra a rutas administrativas y operativas', () => {
    guardarSesion('Admin', 1);
    expect(destino(ejecutar(authGuard, ['admin']))).toBe(true);
    expect(destino(ejecutar(authGuard, ['admin', 'empleado']))).toBe(true);
  });

  it('un rol escrito a mano en localStorage no concede acceso', () => {
    localStorage.setItem('rolUsuario', 'admin');
    guardarSesion('Empleado', 5);
    expect(destino(ejecutar(authGuard, ['admin']))).toBe('/rentas');
  });

  it('loginGuard e inicioGuard envían a cada rol a su página de inicio', () => {
    expect(destino(ejecutar(loginGuard))).toBe(true);
    expect(destino(ejecutar(inicioGuard))).toBe('/login');

    guardarSesion('Admin', 1);
    expect(destino(ejecutar(loginGuard))).toBe('/dashboard');
    expect(destino(ejecutar(inicioGuard))).toBe('/dashboard');
  });
});
