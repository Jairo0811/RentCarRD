import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { AuthService, AuthSession } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const validSession: AuthSession = {
    accessToken: 'signed-token',
    expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
    idEmpleado: 7,
    nombre: 'Usuario de prueba',
    usuario: 'usuario.prueba',
    rol: 'Empleado',
  };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('stores the session only after a successful API login', () => {
    service.login('usuario.prueba', 'password-seguro').subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/api/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      usuario: 'usuario.prueba',
      password: 'password-seguro',
    });

    request.flush(validSession);

    expect(service.session).toEqual(validSession);
    expect(service.isAuthenticated).toBe(true);
  });

  it('rejects and clears an expired session', () => {
    sessionStorage.setItem(
      'rentcarrd.auth.session',
      JSON.stringify({
        ...validSession,
        expiresAtUtc: new Date(Date.now() - 60_000).toISOString(),
      }),
    );

    expect(service.session).toBeNull();
    expect(sessionStorage.getItem('rentcarrd.auth.session')).toBeNull();
  });

  it('removes the current session on logout', () => {
    sessionStorage.setItem('rentcarrd.auth.session', JSON.stringify(validSession));

    service.logout();

    expect(service.session).toBeNull();
  });
});
