import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthSession {
  accessToken: string;
  expiresAtUtc: string;
  idEmpleado: number;
  nombre: string;
  usuario: string;
  rol: 'Administrador' | 'Empleado';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth`;
  private readonly sessionKey = 'rentcarrd.auth.session';

  constructor(private readonly http: HttpClient) {}

  login(usuario: string, password: string): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${this.apiUrl}/login`, { usuario, password })
      .pipe(tap((session) => this.storeSession(session)));
  }

  logout(): void {
    if (this.hasBrowserStorage()) {
      sessionStorage.removeItem(this.sessionKey);
    }
  }

  get session(): AuthSession | null {
    if (!this.hasBrowserStorage()) return null;

    const value = sessionStorage.getItem(this.sessionKey);
    if (!value) return null;

    try {
      const session = JSON.parse(value) as AuthSession;
      if (!session.accessToken || Date.parse(session.expiresAtUtc) <= Date.now()) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      this.logout();
      return null;
    }
  }

  get accessToken(): string | null {
    return this.session?.accessToken ?? null;
  }

  get isAuthenticated(): boolean {
    return this.session !== null;
  }

  get isAdmin(): boolean {
    return this.session?.rol === 'Administrador';
  }

  private storeSession(session: AuthSession): void {
    if (!this.hasBrowserStorage()) return;
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  private hasBrowserStorage(): boolean {
    return typeof window !== 'undefined' && typeof sessionStorage !== 'undefined';
  }
}
