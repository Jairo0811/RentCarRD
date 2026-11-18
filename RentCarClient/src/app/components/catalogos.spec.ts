import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import Swal from 'sweetalert2';
import { MarcasComponent } from './marcas/marcas';
import { TiposVehiculosComponent } from './tipos-vehiculos/tipos-vehiculos';
import { TiposCombustiblesComponent } from './tipos-combustibles/tipos-combustibles';
import { ModelosComponent } from './modelos/modelos';
import { Type } from '@angular/core';
import { CatalogoSimpleBase } from './catalogo-simple/catalogo-simple.base';
import { guardarSesion, limpiarAlmacenes } from '../testing/sesion';

describe('Catálogos', () => {
  let http: HttpTestingController;
  let fire: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    limpiarAlmacenes();
    fire = vi.spyOn(Swal, 'fire').mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false } as never);
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    fire.mockRestore();
    limpiarAlmacenes();
  });

  const catalogos: [Type<CatalogoSimpleBase>, string][] = [
    [MarcasComponent, 'Marcas'],
    [TiposVehiculosComponent, 'TiposVehiculos'],
    [TiposCombustiblesComponent, 'TiposCombustibles'],
  ];
  for (const [Componente, recurso] of catalogos) {
    it(`${recurso}: el Empleado conserva la gestión (permisos v1.2), con validación de duplicados y confirmación`, async () => {
      guardarSesion('Empleado', 3);
      const fixture = TestBed.createComponent(Componente);
      fixture.detectChanges();
      http.expectOne((r) => r.url.endsWith(`/api/${recurso}`)).flush([{ id: 1, descripcion: 'Existente', estado: true }]);
      fixture.detectChanges();
      const c = fixture.componentInstance;
      const html = fixture.nativeElement as HTMLElement;

      expect(c.puedeEditar()).toBe(true);
      expect(html.querySelector('form')).not.toBeNull();
      expect(html.querySelector(`label[for="${c.idCampo}"]`)).not.toBeNull();

      c.actual = { descripcion: ' existente ', estado: true };
      c.guardar();
      http.expectNone((r) => r.method === 'POST');

      c.actual = { descripcion: '  Nueva  ', estado: true };
      c.guardar();
      const post = http.expectOne((r) => r.method === 'POST' && r.url.endsWith(`/api/${recurso}`));
      expect(post.request.body).toEqual({ descripcion: 'Nueva', estado: true });
      post.flush({ id: 2, descripcion: 'Nueva', estado: true });
      http.expectOne((r) => r.method === 'GET').flush([]);

      fire.mockResolvedValueOnce({ isConfirmed: false, isDenied: false, isDismissed: true } as never);
      await c.eliminar({ id: 1, descripcion: 'Existente', estado: true });
      http.expectNone((r) => r.method === 'DELETE');
    });
  }

  it('el mensaje 409 del backend (registro en uso) llega al usuario', async () => {
    guardarSesion('Admin', 1);
    const fixture = TestBed.createComponent(MarcasComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/api/Marcas')).flush([]);
    await fixture.componentInstance.eliminar({ id: 1, descripcion: 'Toyota', estado: true });
    http.expectOne((r) => r.method === 'DELETE').flush('No se puede eliminar la marca porque tiene modelos asociados. Puede inactivarla.', { status: 409, statusText: 'Conflict' });
    expect(fire).toHaveBeenLastCalledWith(expect.objectContaining({ text: expect.stringContaining('tiene modelos asociados') }));
  });

  it('Modelos: envía la marca seleccionada y rechaza duplicados dentro de la misma marca', () => {
    guardarSesion('Empleado', 3);
    const fixture = TestBed.createComponent(ModelosComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.endsWith('/api/Modelos')).flush([{ id: 1, idMarca: 1, descripcion: 'Corolla', estado: true }]);
    http.expectOne((r) => r.url.endsWith('/api/Marcas')).flush([{ id: 1, descripcion: 'Toyota', estado: true }, { id: 2, descripcion: 'Honda', estado: false }]);
    const c = fixture.componentInstance;

    expect(c.marcasSeleccionables.map((m) => m.id)).toEqual([1]);
    c.modeloActual = { idMarca: 1, descripcion: 'corolla', estado: true };
    c.guardarModelo();
    http.expectNone((r) => r.method === 'POST');

    c.modeloActual = { idMarca: 1, descripcion: 'Yaris', estado: true };
    c.guardarModelo();
    const post = http.expectOne((r) => r.method === 'POST');
    expect(post.request.body).toEqual({ idMarca: 1, descripcion: 'Yaris', estado: true });
    post.flush({});
    http.expectOne((r) => r.url.endsWith('/api/Modelos')).flush([]);
    http.expectOne((r) => r.url.endsWith('/api/Marcas')).flush([]);
  });
});
