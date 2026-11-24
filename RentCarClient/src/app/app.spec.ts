import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { App } from './app';
import { routes } from './app.routes';
import { CLAVES_SESION } from './services/auth.service';
import { guardarSesion, limpiarAlmacenes } from './testing/sesion';

@Component({ template: '' })
class Vacia {}

describe('App (navegación y cierre de sesión)', () => {
  beforeEach(async () => {
    limpiarAlmacenes();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideRouter([
          { path: 'login', component: Vacia },
          { path: 'rentas', component: Vacia },
          { path: 'dashboard', component: Vacia },
        ]),
      ],
    }).compileComponents();
  });
  afterEach(() => limpiarAlmacenes());

  function renderizar() {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    return { fixture, html: fixture.nativeElement as HTMLElement };
  }

  it('sin sesión no muestra la navegación', () => {
    const { html } = renderizar();
    expect(html.querySelector('nav')).toBeNull();
  });

  it('muestra la marca y los módulos administrativos solo al Admin', () => {
    guardarSesion('Admin', 1, 30, 'Administrador General');
    const { html } = renderizar();

    const logo = html.querySelector<HTMLImageElement>('.navbar-brand img');
    expect(logo?.getAttribute('src')).toBe('/images/logo-navbar.png');
    expect(logo?.alt).toContain('RentCarRD');
    expect(html.querySelector('.navbar-brand')?.textContent?.trim()).toBe('');
    const enlaces = Array.from(html.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'));
    expect(enlaces).toEqual(expect.arrayContaining(['/dashboard', '/empleados', '/vehiculos', '/inspeccion', '/reportes', '/rentas', '/clientes']));
    expect(html.textContent).toContain('Administrador General · Admin');
  });

  it('el Empleado ve rentas, clientes y catálogos, pero no los módulos administrativos', () => {
    guardarSesion('Empleado', 4);
    const { html } = renderizar();
    const enlaces = Array.from(html.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'));

    expect(enlaces).toEqual(expect.arrayContaining(['/rentas', '/clientes', '/marcas', '/modelos']));
    for (const admin of ['/dashboard', '/empleados', '/vehiculos', '/inspeccion', '/reportes']) {
      expect(enlaces).not.toContain(admin);
    }
  });

  it('los desplegables son botones semánticos (sin javascript:void(0))', () => {
    guardarSesion('Admin', 1);
    const { html } = renderizar();
    expect(html.querySelector('a[href^="javascript"]')).toBeNull();
    expect(html.querySelectorAll('button.dropdown-toggle').length).toBe(3);
  });

  it('regresión v1.2: "Cerrar sesión" elimina el JWT de sessionStorage y navega a /login', async () => {
    guardarSesion('Admin', 1);
    localStorage.setItem('rolUsuario', 'admin');
    const { fixture, html } = renderizar();
    const router = TestBed.inject(Router);
    const navegar = vi.spyOn(router, 'navigateByUrl');

    const boton = Array.from(html.querySelectorAll('button')).find((b) => b.textContent?.includes('Cerrar sesión'))!;
    boton.click();
    fixture.detectChanges();

    expect(sessionStorage.getItem(CLAVES_SESION.token)).toBeNull();
    expect(sessionStorage.getItem(CLAVES_SESION.expira)).toBeNull();
    expect(localStorage.getItem('rolUsuario')).toBeNull();
    expect(navegar).toHaveBeenCalledWith('/login');
    expect(html.querySelector('nav')).toBeNull();
  });

  it('las rutas administrativas declaran el rol admin y las operativas ambos roles', () => {
    const roles = (path: string) => routes.find((r) => r.path === path)?.data?.['roles'];
    for (const path of ['dashboard', 'empleados', 'vehiculos', 'inspeccion', 'reportes']) {
      expect(roles(path)).toEqual(['admin']);
    }
    for (const path of ['rentas', 'clientes', 'marcas', 'modelos', 'tipos-vehiculos', 'tipos-combustibles']) {
      expect(roles(path)).toEqual(['admin', 'empleado']);
    }
  });
});
