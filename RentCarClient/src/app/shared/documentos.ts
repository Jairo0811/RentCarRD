import { TipoPersona } from '../interfaces/modelos';

/**
 * Validación local de documentos dominicanos (misma lógica que DocumentosDominicanos en la API).
 * La validación definitiva —y la comprobación de duplicados— la hace siempre el servidor.
 */

export function soloDigitos(valor: string | null | undefined, maximo?: number): string {
  const digitos = (valor ?? '').replace(/\D/g, '');
  return maximo ? digitos.slice(0, maximo) : digitos;
}

/** Cédula de 11 dígitos con dígito verificador (Luhn / módulo 10). */
export function cedulaValida(cedula: string | null | undefined): boolean {
  const d = soloDigitos(cedula);
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;

  const pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    let valor = Number(d[i]) * pesos[i];
    if (valor >= 10) valor = Math.floor(valor / 10) + (valor % 10);
    suma += valor;
  }
  return (10 - (suma % 10)) % 10 === Number(d[10]);
}

/** RNC de 9 dígitos con dígito verificador (módulo 11 de la DGII). */
export function rncValido(rnc: string | null | undefined): boolean {
  const d = soloDigitos(rnc);
  if (d.length !== 9 || /^(\d)\1{8}$/.test(d)) return false;

  const pesos = [7, 9, 8, 6, 5, 4, 3, 2];
  let suma = 0;
  for (let i = 0; i < 8; i++) suma += Number(d[i]) * pesos[i];

  const resto = suma % 11;
  const digito = resto === 0 ? 2 : resto === 1 ? 1 : 11 - resto;
  return digito === Number(d[8]);
}

export function longitudDocumento(tipo: TipoPersona): number {
  return tipo === 'Juridica' ? 9 : 11;
}

export function documentoValido(documento: string, tipo: TipoPersona): boolean {
  return tipo === 'Juridica' ? rncValido(documento) : cedulaValida(documento);
}

/** Formato progresivo: cédula 000-0000000-0, RNC 000-00000-0. */
export function formatearDocumento(documento: string | null | undefined, tipo: TipoPersona = 'Fisica'): string {
  const limpio = soloDigitos(documento, longitudDocumento(tipo));
  const corte = tipo === 'Juridica' ? 8 : 10;
  if (limpio.length <= 3) return limpio;
  if (limpio.length <= corte) return `${limpio.slice(0, 3)}-${limpio.slice(3)}`;
  return `${limpio.slice(0, 3)}-${limpio.slice(3, corte)}-${limpio.slice(corte)}`;
}
