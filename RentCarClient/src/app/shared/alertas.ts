import { HttpErrorResponse } from '@angular/common/http';
import Swal, { SweetAlertIcon } from 'sweetalert2';

/**
 * Mensajería uniforme de RentCarRD basada en SweetAlert2.
 * Sustituye a los `alert()` / `confirm()` nativos y a la sobrescritura global de
 * `window.alert` que existía en main.ts.
 */
export type TipoAviso = 'success' | 'error' | 'warning' | 'info';

const COLOR_PRINCIPAL = '#0d6efd';

const TITULOS: Record<TipoAviso, string> = {
  success: 'Operación completada',
  error: 'No se pudo completar',
  warning: 'Atención',
  info: 'Información',
};

/** Deduce el tipo de aviso a partir del texto (compatibilidad con los mensajes existentes). */
export function tipoDeMensaje(mensaje: string): TipoAviso {
  const texto = mensaje.toLowerCase();
  if (/(correctamente|éxito|exitosa|generado|exportado)/.test(texto)) return 'success';
  if (/(error|inválid|no se pudo|no fue posible|no puede|obligatori|debes|no existe|no se encontró)/.test(texto)) return 'error';
  if (/(advertencia|selecciona|seleccione|completa|verifique|ingresa|no existen)/.test(texto)) return 'warning';
  return 'info';
}

export function notificar(mensaje: string, tipo: TipoAviso = tipoDeMensaje(mensaje)): Promise<unknown> {
  return Swal.fire({
    icon: tipo as SweetAlertIcon,
    title: TITULOS[tipo],
    text: mensaje,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: COLOR_PRINCIPAL,
    allowOutsideClick: false,
  });
}

/** Confirmación accesible (foco en "Cancelar" para acciones destructivas). */
export async function confirmar(
  mensaje: string,
  opciones: { titulo?: string; textoConfirmar?: string; peligroso?: boolean } = {},
): Promise<boolean> {
  const resultado = await Swal.fire({
    icon: 'question',
    title: opciones.titulo ?? '¿Confirmar acción?',
    text: mensaje,
    showCancelButton: true,
    confirmButtonText: opciones.textoConfirmar ?? 'Sí, continuar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: opciones.peligroso ? '#dc3545' : COLOR_PRINCIPAL,
    focusCancel: opciones.peligroso ?? false,
    reverseButtons: true,
  });
  return resultado.isConfirmed;
}

/**
 * Extrae un mensaje comprensible de cualquier error HTTP de la API:
 * texto plano, { mensaje }, { message }, ProblemDetails (detail/title) o
 * ValidationProblemDetails (errors).
 */
export function mensajeError(error: unknown, porDefecto = 'Ocurrió un error inesperado.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'No se pudo conectar con el servidor. Verifique su conexión e intente nuevamente.';
    if (error.status === 403) return 'No tiene permisos para realizar esta operación.';
    if (error.status === 429) return 'Demasiadas solicitudes. Espere unos minutos e intente nuevamente.';
    return mensajeDeCuerpo(error.error) ?? porDefecto;
  }
  return mensajeDeCuerpo((error as { error?: unknown } | null)?.error) ?? porDefecto;
}

function mensajeDeCuerpo(cuerpo: unknown): string | null {
  if (!cuerpo) return null;
  if (typeof cuerpo === 'string') {
    const texto = cuerpo.trim();
    if (!texto) return null;
    try {
      return mensajeDeCuerpo(JSON.parse(texto)) ?? texto;
    } catch {
      return texto;
    }
  }
  if (typeof cuerpo === 'object') {
    const objeto = cuerpo as Record<string, unknown>;
    const errores = objeto['errors'];
    if (errores && typeof errores === 'object') {
      const primeros = Object.values(errores as Record<string, unknown>)
        .flatMap((valor) => (Array.isArray(valor) ? valor : [valor]))
        .filter((valor): valor is string => typeof valor === 'string');
      if (primeros.length) return primeros.join(' ');
    }
    for (const clave of ['mensaje', 'message', 'detail', 'title']) {
      const valor = objeto[clave];
      if (typeof valor === 'string' && valor.trim()) return valor.trim();
    }
  }
  return null;
}
