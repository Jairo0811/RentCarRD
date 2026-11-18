import { CLAVES_SESION } from '../services/auth.service';

/** Utilidades de prueba: JWT sin firma válida (el frontend no verifica firmas; lo hace la API). */
function base64Url(texto: string): string {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  bytes.forEach((b) => (binario += String.fromCharCode(b)));
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function crearToken(payload: Record<string, unknown>): string {
  return `${base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${base64Url(JSON.stringify(payload))}.firma`;
}

export const CLAIM_ROL_MS = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export function tokenPara(rol: 'Admin' | 'Empleado', empleadoId = 7, minutos = 30): { token: string; expira: string } {
  const exp = Math.floor(Date.now() / 1000) + minutos * 60;
  return {
    token: crearToken({ sub: rol.toLowerCase(), [CLAIM_ROL_MS]: rol, empleado_id: String(empleadoId), exp }),
    expira: new Date(exp * 1000).toISOString(),
  };
}

/** Deja una sesión de RentCarRD en sessionStorage como lo haría AuthService.login(). */
export function guardarSesion(rol: 'Admin' | 'Empleado', empleadoId = 7, minutos = 30, nombre = 'Usuario de prueba'): string {
  const { token, expira } = tokenPara(rol, empleadoId, minutos);
  sessionStorage.setItem(CLAVES_SESION.token, token);
  sessionStorage.setItem(CLAVES_SESION.expira, expira);
  sessionStorage.setItem(CLAVES_SESION.nombre, nombre);
  return token;
}

export function limpiarAlmacenes(): void {
  sessionStorage.clear();
  localStorage.clear();
}
