import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginResponse {
  accessToken: string;
  expiresAtUtc: string;
  rol: string;
  empleadoId: number | null;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:5266/api/auth';
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

  token(): string | null { return sessionStorage.getItem('accessToken'); }
  isAuthenticated(): boolean {
    const expires = sessionStorage.getItem('tokenExpiresAt');
    return !!this.token() && !!expires && Date.parse(expires) > Date.now();
  }
  logout(): void {
    sessionStorage.clear();
    ['rolUsuario', 'idEmpleado', 'nombreUsuario'].forEach(key => localStorage.removeItem(key));
  }
}
