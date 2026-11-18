/**
 * Utilidades de fecha en hora local.
 *
 * `new Date().toISOString().split('T')[0]` devuelve la fecha UTC: en República Dominicana
 * (UTC−4), a partir de las 20:00 produce el día siguiente. Estas funciones trabajan siempre
 * con la fecha de calendario local del usuario.
 */

/** Fecha local en formato yyyy-MM-dd (valor para <input type="date"> y para la API). */
export function fechaLocalISO(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Convierte un valor de la API o de un input a Date en hora local.
 * - "yyyy-MM-dd" se interpreta como fecha local (no UTC, como haría `new Date(texto)`).
 * - "yyyy-MM-ddTHH:mm:ss" sin zona (datetime2 de SQL Server) se interpreta como local.
 */
export function parsearFecha(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  if (valor instanceof Date) return Number.isNaN(valor.getTime()) ? null : valor;

  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor);
  if (soloFecha) {
    const [, anio, mes, dia] = soloFecha;
    return new Date(Number(anio), Number(mes) - 1, Number(dia));
  }

  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Inicio (00:00) o fin (23:59:59.999) del día local indicado en formato yyyy-MM-dd. */
export function limiteDelDia(fechaIso: string, finDelDia: boolean): Date | null {
  const fecha = parsearFecha(fechaIso);
  if (!fecha) return null;
  if (finDelDia) fecha.setHours(23, 59, 59, 999);
  else fecha.setHours(0, 0, 0, 0);
  return fecha;
}

export function formatearFecha(valor: string | Date | null | undefined, vacio = 'Pendiente'): string {
  const fecha = parsearFecha(valor);
  return fecha ? fecha.toLocaleDateString('es-DO') : vacio;
}

/** Marca de tiempo local para nombres de archivo: yyyyMMdd_HHmmss. */
export function marcaDeTiempo(fecha: Date = new Date()): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fechaLocalISO(fecha).replaceAll('-', '')}_${dos(fecha.getHours())}${dos(fecha.getMinutes())}${dos(fecha.getSeconds())}`;
}
