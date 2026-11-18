/**
 * Cálculo monetario de RentCarRD, idéntico al del backend (CalculadoraRenta):
 * subtotal = tarifa × días, ITBIS = 18 % del subtotal, total = subtotal + ITBIS.
 *
 * Se trabaja en centavos enteros para evitar errores de coma flotante
 * (p. ej. 100.25 × 0.18 = 18.044999… en JavaScript) y se aplica redondeo comercial
 * (mitades hacia arriba), igual que MidpointRounding.AwayFromZero en C#.
 */
export const TASA_ITBIS_PORCENTAJE = 18;

export interface Desglose {
  subtotal: number;
  itbis: number;
  total: number;
}

export interface ImportesRenta {
  montoXDia?: number | null;
  cantidadDias?: number | null;
  subtotal?: number | null;
  itbis?: number | null;
  total?: number | null;
}

export function aCentavos(valor: number | string | null | undefined): number {
  const numero = Number(valor ?? 0);
  if (!Number.isFinite(numero)) return 0;
  // toFixed(2) normaliza representaciones como 2500.4999999 antes de convertir.
  return Math.round(Number(numero.toFixed(2)) * 100);
}

export function deCentavos(centavos: number): number {
  return centavos / 100;
}

export function calcularDesglose(montoXDia: number | null | undefined, cantidadDias: number | null | undefined): Desglose {
  const dias = Math.max(0, Math.trunc(Number(cantidadDias ?? 0)));
  const subtotalCentavos = aCentavos(montoXDia) * dias;
  // (subtotal × 18) / 100 sobre enteros: el redondeo es exacto y "half up" para positivos.
  const itbisCentavos = Math.round((subtotalCentavos * TASA_ITBIS_PORCENTAJE) / 100);
  return {
    subtotal: deCentavos(subtotalCentavos),
    itbis: deCentavos(itbisCentavos),
    total: deCentavos(subtotalCentavos + itbisCentavos),
  };
}

/**
 * Desglose de una renta registrada. Usa los importes persistidos por el servidor; solo si
 * faltan (registros anteriores a v1.2) los calcula a partir de la tarifa y los días.
 */
export function desgloseRenta(renta: ImportesRenta | null | undefined): Desglose {
  const subtotal = Number(renta?.subtotal ?? 0);
  const itbis = Number(renta?.itbis ?? 0);
  const total = Number(renta?.total ?? 0);
  if (subtotal > 0 && total > 0) {
    return { subtotal, itbis, total };
  }
  return calcularDesglose(renta?.montoXDia, renta?.cantidadDias);
}

export function sumarDesgloses(desgloses: Desglose[]): Desglose {
  const suma = desgloses.reduce(
    (acumulado, d) => ({
      subtotal: acumulado.subtotal + aCentavos(d.subtotal),
      itbis: acumulado.itbis + aCentavos(d.itbis),
      total: acumulado.total + aCentavos(d.total),
    }),
    { subtotal: 0, itbis: 0, total: 0 },
  );
  return { subtotal: deCentavos(suma.subtotal), itbis: deCentavos(suma.itbis), total: deCentavos(suma.total) };
}

const formatoMoneda = new Intl.NumberFormat('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Formato de moneda dominicana: "RD$ 1,234.50". */
export function formatoRD(valor: number | null | undefined): string {
  return `RD$ ${formatoMoneda.format(Number(valor ?? 0) || 0)}`;
}
