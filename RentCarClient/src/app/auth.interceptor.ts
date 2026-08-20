import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { environment } from '../environments/environment';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.accessToken;
  const apiPrefix = `${environment.apiBaseUrl}/api`;
  const isApiRequest = request.url.startsWith(apiPrefix);
  const authenticatedRequest = token && isApiRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        isApiRequest &&
        error.status === 401 &&
        !request.url.endsWith('/api/auth/login')
      ) {
        auth.logout();
        void router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
