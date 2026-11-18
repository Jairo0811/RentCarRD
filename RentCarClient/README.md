# RentCarClient — frontend de RentCarRD v1.2.1

SPA en **Angular 21** (componentes standalone, sin Zone.js) con Bootstrap 5, SweetAlert2, jsPDF y ExcelJS.
La documentación general, las reglas de negocio y los permisos están en el [README principal](../README.md).

## Requisitos

- Node.js 22 o 24 y npm 11
- API de RentCarRD en ejecución (`https://localhost:7162` en desarrollo)

## Comandos

```bash
npm ci              # instalación reproducible a partir de package-lock.json
npm start           # servidor de desarrollo en http://localhost:4200
npm run build       # compilación de producción en dist/
npm run test:ci     # pruebas Vitest (una ejecución)
npm run audit:gate  # auditoría npm con la política del proyecto
```

## Configuración por entorno

| Archivo | `apiBaseUrl` | Uso |
|---|---|---|
| `src/environments/environment.development.ts` | `https://localhost:7162` | `npm start` |
| `src/environments/environment.ts` | `''` (mismo origen) | compilación de producción |

El interceptor solo adjunta el JWT a solicitudes dirigidas a ese origen bajo `/api/`.

## Organización

```text
src/app/
├── components/   # pantallas (rentas, clientes, vehículos, catálogos, reportes…)
├── interfaces/   # contratos tipados de la API
├── services/     # HTTP, sesión (AuthService), guard e interceptor
├── shared/       # alertas SweetAlert2, fechas locales, montos/ITBIS, documentos, contrato PDF
└── testing/      # utilidades exclusivas de las pruebas
```

## Pruebas

Las pruebas (`*.spec.ts`) verifican comportamiento, no solo la creación de componentes:
sesión y cierre de sesión, guards por rol, interceptor (destino del token, 401/403), rentas
(sin listado de empleados, sin `idEmpleado`, doble envío, devolución), clientes (método de pago
simulado), dashboard, filtros y exportación Excel de reportes, contrato PDF, inspecciones,
catálogos, login, cálculo monetario y fechas.

## Auditoría de dependencias

`npm run audit:gate` falla si hay cualquier vulnerabilidad en dependencias de producción o una
alta/crítica del toolchain sin excepción documentada y vigente en
`security/npm-audit-exceptions.json`.
