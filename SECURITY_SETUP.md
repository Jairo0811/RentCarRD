# Configuración de seguridad — RentCarRD v1.2.1

RentCarRD utiliza autenticación JWT y una política de autorización que exige una sesión válida por defecto. Solo el inicio de sesión y el endpoint de salud son públicos.

## Desarrollo local

El proyecto incluye valores portables para SQL Server LocalDB y CORS en `appsettings.Development.json`, pero la clave JWT nunca se almacena en el repositorio.

Desde `RentCar.API/RentCar.API` configure el secreto de desarrollo:

```powershell
dotnet user-secrets set "Jwt:Key" "<secreto-aleatorio-de-32-o-mas-caracteres>"
```

Cree o actualice la base (en una base existente, **haga antes un respaldo**: ver [`docs/BASE_DE_DATOS.md`](docs/BASE_DE_DATOS.md)) e inicialice el administrador una sola vez:

```powershell
dotnet ef database update
$env:RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD = "<contraseña-inicial-de-12-o-mas-caracteres>"
$env:RENTCARRD_BOOTSTRAP_ADMIN_CEDULA = "<cédula-dominicana-válida>"   # solo si aún no existe 'admin'
dotnet run --launch-profile https
Remove-Item Env:RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD, Env:RENTCARRD_BOOTSTRAP_ADMIN_CEDULA
```

La contraseña bootstrap:

- crea la cuenta `admin` si no existe (exige una cédula válida en `RENTCARRD_BOOTSTRAP_ADMIN_CEDULA`), o
- asigna contraseña a un `admin` existente que aún no tenga `PasswordHash`.

Nunca sobrescribe una contraseña existente. Debe retirarse inmediatamente después de inicializar.

El frontend de desarrollo utiliza `https://localhost:7162` mediante `src/environments/environment.development.ts`.

## Producción o demostración desplegada

No use los valores de desarrollo. Configure mediante variables de entorno o el gestor de secretos de la plataforma:

- `ConnectionStrings__DefaultConnection`: conexión de SQL Server.
- `Jwt__Key`: secreto JWT de 32 o más caracteres.
- `Cors__AllowedOrigins__0`: origen HTTPS permitido para el frontend.
- `AllowedHosts`: dominio público permitido.
- `Database__MigrateOnStartup=true`: únicamente si se desea aplicar migraciones al iniciar.
- `Negocio__ZonaHoraria` (opcional): zona IANA del negocio; por defecto `America/Santo_Domingo` (fecha real de devoluciones e inspecciones).

La API rechaza una configuración de producción con CORS no HTTPS o `AllowedHosts=*`.

## Autenticación y autorización

- JWT firmado (HS256) con validación de issuer, audience, firma y expiración (30 minutos por defecto).
- En cada solicitud autenticada la API comprueba que el empleado del claim `empleado_id` **existe, está activo y conserva el rol firmado**. Inactivar a un empleado revoca su acceso de inmediato.
- Roles: `Admin` (cuenta `admin`) y `Empleado` (resto de cuentas activas), como en v1.2.
  - Solo `Admin`: empleados; alta, edición, imágenes y eliminación de vehículos; inspecciones; eliminación de rentas (que siempre se rechaza por historial).
  - `Admin` y `Empleado`: rentas y devoluciones, clientes, catálogos, consulta de vehículos y `GET /api/auth/me`.
- **Atribución**: el empleado responsable de una renta o inspección se toma del claim firmado, nunca del cuerpo de la solicitud. Un `idEmpleado` enviado en el JSON se ignora.
- La cuenta `admin` no puede renombrarse, inactivarse ni eliminarse, y nadie puede inactivarse o eliminarse a sí mismo.
- Contraseñas con `PasswordHasher` (8–128 caracteres, al menos una letra y un número). Las respuestas nunca incluyen hashes.

### Frontend

- El JWT y su expiración se guardan en `sessionStorage` (se descartan al cerrar la pestaña). Rol y empleado se leen del propio token; los valores de `localStorage` no conceden permisos.
- El interceptor adjunta el token **solo** a la API de RentCarRD (mismo origen que `environment.apiBaseUrl`, o el origen actual si está vacío). Un `401` cierra la sesión y lleva a `/login`; un `403` no la cierra.
- Cerrar sesión elimina el token, su expiración y las claves de RentCarRD (también las heredadas de v1.2), sin tocar datos de otras aplicaciones.
- Los guards por rol son un control de experiencia de usuario: la protección real es la de la API.

## Datos de pago

RentCarRD **no procesa pagos**. El "método de pago" del cliente es una referencia simulada: marca (`VISA`, `MASTERCARD`, `AMEX`, `DISCOVER`) y **4 dígitos ficticios**.

- La interfaz no solicita número completo (PAN), titular, fecha de expiración ni CVV, y advierte que no se introduzcan datos reales.
- La API rechaza cualquier valor que no sean exactamente 4 dígitos (no trunca en silencio) y nunca devuelve más de 4 dígitos.
- La columna `Clientes.NoTarjetaCR` queda limitada a `varchar(4)`; la migración v1.2.1 reduce los datos históricos a 4 dígitos y vacía titular y expiración.

Un sistema comercial debería delegar cualquier cobro a un proveedor compatible con PCI DSS y guardar solo tokens del proveedor.

## Imágenes de vehículos

- Extensión permitida (JPG, PNG, WebP), máximo 5 MB, firma binaria coherente.
- Análisis estructural del formato real (`ValidadorImagenes`): CRC y flujo zlib en PNG (con límite contra bombas de descompresión), segmentos JPEG, chunks RIFF/WebP; se rechazan archivos truncados, con datos añadidos o animados.
- Dimensiones entre 32 y 4096 px.
- Se eliminan metadatos (EXIF/GPS, XMP, IPTC, ICC, comentarios, textos PNG) y se guarda la versión limpia con un nombre generado por el servidor.
- La ruta de la imagen nunca se acepta del cliente; las eliminaciones solo afectan a archivos con el patrón generado dentro de `wwwroot/vehiculos`.

## Controles HTTP

- Rate limiting global por IP y reforzado para el login.
- CORS restringido por configuración; HSTS y redirección HTTPS fuera de Development.
- Cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- Errores de SQL Server (duplicados, integridad referencial, concurrencia) traducidos a `409`/`400` con `ProblemDetails`, sin detalles internos.
- Endpoint público `GET /health`.

## Dependencias y CI

- Auditoría NuGet en cada `restore` (moderada o superior = error) y `dotnet list package --vulnerable --include-transitive`.
- `npm run audit:gate`: cero vulnerabilidades en dependencias de producción. Las altas o críticas del toolchain de desarrollo solo se admiten si están en `RentCarClient/security/npm-audit-exceptions.json` con motivo, alcance y fecha de revisión; una excepción vencida hace fallar CI.
  - Excepción vigente: `GHSA-fc5q-39xc-vjpf` (picomatch ≤ 4.0.7, ReDoS). No existe versión corregida publicada; solo la usan Angular CLI, Vite y Vitest con patrones del propio repositorio. Revisión: 31-01-2027.
- Acciones de GitHub fijadas por SHA y `GITHUB_TOKEN` con permiso `contents: read`.
- Dependabot en modo mantenimiento: solo actualizaciones de seguridad.
- La contraseña de SQL Server que aparece en `ci.yml` pertenece a un contenedor efímero que solo existe durante el job de pruebas; no protege ningún dato real.

## Estado del proyecto

La versión 1.2 es la edición final de portafolio y la 1.2.1 su parche final de calidad y seguridad. El proyecto está en **maintenance mode**: se aceptan correcciones críticas de seguridad o compatibilidad, pero no se amplía el alcance funcional.
