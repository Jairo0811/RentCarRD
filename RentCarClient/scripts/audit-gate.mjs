#!/usr/bin/env node
/*
 * Puerta de auditoría npm de RentCarRD.
 *
 * Reglas:
 *  1. Las dependencias de producción (lo que llega al navegador) no pueden tener
 *     NINGUNA vulnerabilidad conocida, de ninguna severidad.
 *  2. En el árbol completo (incluye toolchain de desarrollo) no se admite ninguna
 *     vulnerabilidad alta o crítica, salvo advisories documentados explícitamente
 *     en security/npm-audit-exceptions.json con justificación y fecha de revisión.
 *  3. Una excepción vencida, o que afecte a dependencias de producción, hace fallar el CI.
 *  4. Una excepción que ya no es necesaria se informa como advertencia para retirarla.
 *
 * No modifica dependencias ni oculta resultados: imprime el inventario completo.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const severidadesBloqueantes = new Set(['high', 'critical']);

function auditar(argumentos) {
  try {
    return JSON.parse(
      execFileSync('npm', ['audit', '--json', ...argumentos], {
        cwd: raiz,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        maxBuffer: 64 * 1024 * 1024,
      }),
    );
  } catch (error) {
    // npm audit devuelve código 1 cuando encuentra vulnerabilidades; el JSON sigue en stdout.
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
}

function advisoriesRaiz(reporte) {
  const encontrados = new Map();
  for (const vulnerabilidad of Object.values(reporte.vulnerabilities ?? {})) {
    for (const via of vulnerabilidad.via ?? []) {
      if (typeof via !== 'object' || !via.url) continue;
      const id = via.url.split('/').pop();
      const existente = encontrados.get(id) ?? {
        id,
        paquete: via.name,
        severidad: via.severity,
        rango: via.range,
        titulo: via.title,
        afectados: new Set(),
      };
      existente.afectados.add(vulnerabilidad.name);
      encontrados.set(id, existente);
    }
  }
  return [...encontrados.values()];
}

const excepciones = JSON.parse(
  readFileSync(join(raiz, 'security', 'npm-audit-exceptions.json'), 'utf8'),
).exceptions;
const hoy = new Date().toISOString().slice(0, 10);
const errores = [];
const advertencias = [];

// 1. Producción: tolerancia cero.
const produccion = auditar(['--omit=dev']);
const totalProduccion = produccion.metadata?.vulnerabilities?.total ?? 0;
if (totalProduccion > 0) {
  for (const advisory of advisoriesRaiz(produccion)) {
    errores.push(
      `Producción: ${advisory.id} (${advisory.severidad}) en ${advisory.paquete} ${advisory.rango} — ${advisory.titulo}`,
    );
  }
}

// 2. Árbol completo.
const completo = auditar([]);
const raices = advisoriesRaiz(completo);
const idsExceptuados = new Set(excepciones.map((excepcion) => excepcion.id));

console.log('Inventario de advisories (árbol completo):');
for (const advisory of raices.sort((a, b) => a.severidad.localeCompare(b.severidad))) {
  const marca = idsExceptuados.has(advisory.id) ? 'EXCEPCIÓN DOCUMENTADA' : '';
  console.log(
    `  - [${advisory.severidad}] ${advisory.id} ${advisory.paquete} ${advisory.rango} ` +
      `(${advisory.afectados.size} paquetes dependientes) ${marca}`,
  );
  if (!severidadesBloqueantes.has(advisory.severidad)) continue;
  if (!idsExceptuados.has(advisory.id)) {
    errores.push(
      `Sin excepción: ${advisory.id} (${advisory.severidad}) en ${advisory.paquete} — ${advisory.titulo}`,
    );
  }
}

// 3. Validez de cada excepción.
const idsProduccion = new Set(advisoriesRaiz(produccion).map((advisory) => advisory.id));
for (const excepcion of excepciones) {
  if (!excepcion.reason || !excepcion.reviewBy || !excepcion.scope) {
    errores.push(`La excepción ${excepcion.id} debe documentar reason, scope y reviewBy.`);
  }
  if (excepcion.reviewBy < hoy) {
    errores.push(`La excepción ${excepcion.id} venció el ${excepcion.reviewBy}; revísela.`);
  }
  if (idsProduccion.has(excepcion.id)) {
    errores.push(`La excepción ${excepcion.id} afecta dependencias de producción; no es admisible.`);
  }
  if (!raices.some((advisory) => advisory.id === excepcion.id)) {
    advertencias.push(`La excepción ${excepcion.id} ya no es necesaria; retírela del archivo.`);
  }
}

const resumen = completo.metadata?.vulnerabilities ?? {};
const lineas = [
  '### Auditoría npm',
  '',
  `- Producción (\`--omit=dev\`): **${totalProduccion}** vulnerabilidades`,
  `- Árbol completo: crítica ${resumen.critical ?? 0} · alta ${resumen.high ?? 0} · moderada ${resumen.moderate ?? 0} · baja ${resumen.low ?? 0}`,
  `- Excepciones documentadas activas: ${excepciones.map((e) => e.id).join(', ') || 'ninguna'}`,
  ...errores.map((error) => `- ❌ ${error}`),
  ...advertencias.map((advertencia) => `- ⚠️ ${advertencia}`),
];
console.log(`\n${lineas.join('\n')}`);
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lineas.join('\n')}\n`);
}
for (const advertencia of advertencias) console.log(`::warning::${advertencia}`);
for (const error of errores) console.log(`::error::${error}`);

process.exit(errores.length > 0 ? 1 : 0);
