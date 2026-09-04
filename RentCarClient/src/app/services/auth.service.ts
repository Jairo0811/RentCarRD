import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  rol: string;
  empleadoId: number | null;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth`;

  constructor(private readonly http: HttpClient) {}

  login(usuario: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { usuario, password }).pipe(
      tap(response => {
        sessionStorage.setItem('accessToken', response.accessToken);
        sessionStorage.setItem('tokenExpiresAt', response.expiresAtUtc);
        localStorage.setItem('rolUsuario', response.rol.toLowerCase());
        localStorage.setItem('idEmpleado', String(response.empleadoId ?? ''));
        localStorage.setItem('nombreUsuario', response.nombre);
      })
    );
  }

  token(): string | null {
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('accessToken') : null;
  }

  isAuthenticated(): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    const expires = sessionStorage.getItem('tokenExpiresAt');
    return !!this.token() && !!expires && Date.parse(expires) > Date.now();
  }

  logout(): void {
    if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
    if (typeof localStorage !== 'undefined') {
      ['rolUsuario', 'idEmpleado', 'nombreUsuario'].forEach(key => localStorage.removeItem(key));
    }
  }
}
