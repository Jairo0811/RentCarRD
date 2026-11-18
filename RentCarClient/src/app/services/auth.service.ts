import { Injectable, computed, signal } from '@angular/core';
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

export type Rol = 'admin' | 'empleado';

export interface Sesion {
  token: string;
  expiraEn: number;
  rol: Rol;
  empleadoId: number | null;
  nombre: string;
}

/** Claves de almacenamiento que pertenecen a RentCarRD (y solo esas se eliminan al salir). */
export const CLAVES_SESION = {
  token: 'rentcarrd.accessToken',
  expira: 'rentcarrd.tokenExpiresAt',
  nombre: 'rentcarrd.nombre',
} as const;

/** Claves usadas por v1.2; se limpian para no dejar residuos de sesiones anteriores. */
export const CLAVES_LEGADAS_SESSION = ['accessToken', 'tokenExpiresAt'] as const;
export const CLAVES_LEGADAS_LOCAL = ['rolUsuario', 'idEmpleado', 'nombreUsuario'] as const;

const CLAIM_ROL = ['role', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

/**
 * Sesión de RentCarRD.
 *
 * - El JWT y su expiración viven en sessionStorage (se descartan al cerrar la pestaña).
 * - Rol y empleado se leen del propio token firmado por la API, no de valores sueltos en
 *   localStorage que el usuario pueda editar. Aun así, en el navegador solo sirven para
 *   adaptar la interfaz: la autorización real la aplica siempre el backend.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiBaseUrl}/api/auth`;
  private readonly sesionActual = signal<Sesion | null>(this.leerSesion());

  readonly sesion = computed(() => {
    const sesion = this.sesionActual();
    return sesion && sesion.expiraEn > Date.now() ? sesion : null;
  });
  readonly rol = computed<Rol | null>(() => this.sesion()?.rol ?? null);
  readonly esAdmin = computed(() => this.rol() === 'admin');
  readonly nombre = computed(() => this.sesion()?.nombre ?? '');

  constructor(private readonly http: HttpClient) {}

  login(usuario: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { usuario, password }).pipe(
      tap((respuesta) => {
        this.limpiarAlmacenamiento();
        const almacen = sesionStorage();
        almacen?.setItem(CLAVES_SESION.token, respuesta.accessToken);
        almacen?.setItem(CLAVES_SESION.expira, respuesta.expiresAtUtc);
        almacen?.setItem(CLAVES_SESION.nombre, respuesta.nombre);
        this.sesionActual.set(this.leerSesion());
      }),
    );
  }

  /** Perfil validado por el servidor (útil tras recargar la página). */
  perfil(): Observable<{ empleadoId: number; nombre: string; usuario: string; rol: string }> {
    return this.http.get<{ empleadoId: number; nombre: string; usuario: string; rol: string }>(`${this.apiUrl}/me`);
  }

  token(): string | null {
    const sesion = this.sesionActual();
    return sesion && sesion.expiraEn > Date.now() ? sesion.token : null;
  }

  empleadoId(): number | null {
    return this.sesion()?.empleadoId ?? null;
  }

  /**
   * Comprueba la sesión contra el almacenamiento (fuente de verdad) y sincroniza el estado en
   * memoria, de modo que rol(), inicio() y la navegación nunca usen una sesión desactualizada.
   * Una sesión expirada se cierra y se limpia.
   */
  isAuthenticated(): boolean {
    const sesion = this.leerSesion();
    if (!sesion || sesion.expiraEn <= Date.now()) {
      if (this.sesionActual() || sesion) this.logout();
      return false;
    }
    if (this.sesionActual()?.token !== sesion.token) {
      this.sesionActual.set(sesion);
    }
    return true;
  }

  /** Página de inicio según el rol. */
  inicio(): string {
    return this.rol() === 'admin' ? '/dashboard' : '/rentas';
  }

  logout(): void {
    this.limpiarAlmacenamiento();
    this.sesionActual.set(null);
  }

  private limpiarAlmacenamiento(): void {
    const session = sesionStorage();
    Object.values(CLAVES_SESION).forEach((clave) => session?.removeItem(clave));
    CLAVES_LEGADAS_SESSION.forEach((clave) => session?.removeItem(clave));
    const local = almacenLocal();
    CLAVES_LEGADAS_LOCAL.forEach((clave) => local?.removeItem(clave));
  }

  private leerSesion(): Sesion | null {
    const almacen = sesionStorage();
    const token = almacen?.getItem(CLAVES_SESION.token);
    const expira = Date.parse(almacen?.getItem(CLAVES_SESION.expira) ?? '');
    if (!token || Number.isNaN(expira)) return null;

    const payload = decodificarPayload(token);
    if (!payload) return null;

    const rolClaim = CLAIM_ROL.map((clave) => payload[clave]).find((valor) => typeof valor === 'string');
    const rol = String(rolClaim ?? '').toLowerCase();
    if (rol !== 'admin' && rol !== 'empleado') return null;

    const expToken = typeof payload['exp'] === 'number' ? payload['exp'] * 1000 : expira;
    const empleadoId = Number(payload['empleado_id']);

    return {
      token,
      expiraEn: Math.min(expira, expToken),
      rol,
      empleadoId: Number.isInteger(empleadoId) && empleadoId > 0 ? empleadoId : null,
      nombre: almacen?.getItem(CLAVES_SESION.nombre) ?? '',
    };
  }
}

/** Decodifica (sin verificar: eso lo hace el servidor) el payload base64url de un JWT. */
export function decodificarPayload(token: string): Record<string, unknown> | null {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const binario = atob(relleno);
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json);
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}

function sesionStorage(): Storage | null {
  return typeof sessionStorage === 'undefined' ? null : sessionStorage;
}

function almacenLocal(): Storage | null {
  return typeof localStorage === 'undefined' ? null : localStorage;
}
