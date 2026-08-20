import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

describe('authInterceptor', () => {
  let client: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            accessToken: 'signed-token',
            logout: () => undefined,
          },
        },
      ],
    });
    client = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('adds the bearer token to API requests', () => {
    const url = `${environment.apiBaseUrl}/api/Clientes`;
    client.get(url).subscribe();

    const request = controller.expectOne(url);
    expect(request.request.headers.get('Authorization')).toBe('Bearer signed-token');
    request.flush([]);
  });

  it('does not leak the bearer token to third-party URLs', () => {
    client.get('https://example.test/public-data').subscribe();

    const request = controller.expectOne('https://example.test/public-data');
    expect(request.request.headers.has('Authorization')).toBe(false);
    request.flush({});
  });
});
