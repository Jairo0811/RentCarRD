# Configuración de seguridad — RentCarRD v1.2

RentCarRD utiliza autenticación JWT y una política de autorización que exige una sesión válida por defecto. Solo el inicio de sesión y el endpoint de salud son públicos.

## Desarrollo local

El proyecto incluye valores portables para SQL Server LocalDB y CORS en `appsettings.Development.json`, pero la clave JWT nunca se almacena en el repositorio.

Desde `RentCar.API/RentCar.API` configure el secreto de desarrollo:

```powershell
dotnet user-secrets set "Jwt:Key" "<secreto-aleatorio-de-32-o-mas-caracteres>"
```

Si la base de datos ya contiene el empleado `admin` sin contraseña, configure temporalmente la contraseña bootstrap antes del primer arranque:

```powershell
$env:RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD = "<contraseña-inicial-de-12-o-mas-caracteres>"
dotnet ef database update
dotnet run --launch-profile https
Remove-Item Env:RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD
```

La contraseña bootstrap solo se aplica cuando existe el usuario `admin` y `PasswordHash` está vacío. Debe retirarse inmediatamente después de inicializarlo.

El frontend de desarrollo utiliza `https://localhost:7162` mediante `src/environments/environment.development.ts`.

## Producción o demostración desplegada

No use los valores de desarrollo. Configure mediante variables de entorno o el gestor de secretos de la plataforma:

- `ConnectionStrings__DefaultConnection`: conexión de SQL Server.
- `Jwt__Key`: secreto JWT de 32 o más caracteres.
- `Cors__AllowedOrigins__0`: origen HTTPS permitido para el frontend.
- `AllowedHosts`: dominio público permitido.
- `Database__MigrateOnStartup=true`: únicamente si se desea aplicar migraciones al iniciar.

La API rechaza una configuración de producción con CORS no HTTPS o `AllowedHosts=*`.

## Controles incluidos en v1.2

- JWT firmado y validación de issuer, audience, firma y expiración.
- Contraseñas almacenadas con `PasswordHasher`.
- Autenticación requerida por defecto.
- Acceso administrativo para la gestión de empleados.
- Rate limiting global y protección reforzada del endpoint de login.
- CORS restringido por configuración.
- HSTS en producción y redirección HTTPS.
- Cabeceras `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`.
- Endpoint público `GET /health` para comprobación operativa.
- CI para compilar backend/frontend, ejecutar pruebas y revisar vulnerabilidades de dependencias.
- Dependabot para NuGet, npm y GitHub Actions.

## Datos de pago

RentCarRD no debe almacenar PAN, CVV ni datos completos de tarjetas. La versión académica conserva únicamente información no sensible necesaria para su demostración. Un eventual sistema comercial debería delegar cualquier cobro real a un proveedor compatible con PCI DSS y persistir solamente tokens o identificadores del proveedor.

## Estado del proyecto

La versión 1.2 es la edición final de portafolio. Tras su publicación, el proyecto entra en **maintenance mode**: se aceptan correcciones críticas de seguridad o compatibilidad, pero no se amplía el alcance funcional.
