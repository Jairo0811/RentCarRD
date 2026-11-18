import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

/**
 * ¿La solicitud va dirigida a la API de RentCarRD?
 *
 * - Con `apiBaseUrl` absoluto (desarrollo: https://localhost:7162) solo se aceptan URLs
 *   de ese mismo origen bajo /api/.
 * - Con `apiBaseUrl` vacío (despliegue en el mismo origen) solo se aceptan rutas relativas
 *   /api/... o URLs absolutas del origen actual de la aplicación.
 * Cualquier otro destino (CDN, assets, terceros) nunca recibe el JWT.
 */
export function esSolicitudApi(url: string, apiBaseUrl: string = environment.apiBaseUrl): boolean {
  const origenActual = typeof location === 'undefined' ? 'http://localhost' : location.origin;
  let destino: URL;
  let base: URL;
  try {
    destino = new URL(url, origenActual + '/');
    base = new URL(apiBaseUrl || origenActual, origenActual + '/');
  } catch {
    return false;
  }

  const prefijoBase = base.pathname.replace(/\/+$/, '');
  return destino.origin === base.origin && destino.pathname.startsWith(`${prefijoBase}/api/`);
}

const URL_LOGIN = '/api/auth/login';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const esApi = esSolicitudApi(request.url);
  const token = esApi ? auth.token() : null;
  const solicitud = token ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : request;

  return next(solicitud).pipe(
    catchError((error: unknown) => {
      // 401 en una solicitud autenticada: sesión expirada o revocada (p. ej. empleado inactivado).
      // Se cierra la sesión una sola vez y se navega a /login sin crear bucles.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        esApi &&
        !request.url.includes(URL_LOGIN)
      ) {
        auth.logout();
        if (!router.url.startsWith('/login')) {
          void router.navigate(['/login'], { queryParams: { motivo: 'sesion' } });
        }
      }
      // 403 no cierra la sesión: el usuario está autenticado pero sin permiso; el
      // componente muestra el mensaje correspondiente.
      return throwError(() => error);
    }),
  );
};
