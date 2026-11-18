# Base de datos — RentCarRD v1.2.1

RentCarRD usa **Microsoft SQL Server** (LocalDB en desarrollo) con **Entity Framework Core 10**.
Desde v1.2.1 el esquema completo se crea y actualiza solo con migraciones; `RentCarDB.sql`
se conserva únicamente como registro histórico del proyecto académico.

## Migraciones

| Migración | Qué hace |
|---|---|
| `20260601000000_EsquemaBase` | Crea cada tabla **solo si no existe**. En una base vacía crea el esquema completo; en una base existente no modifica nada. |
| `20260621211617_AgregarCampoUsuario` | Histórica (v1.2). Ahora idempotente: agrega `Empleados.Usuario` si falta. |
| `20260821030000_AddEmpleadoPasswordHash` | Histórica (v1.2). En v1.2 no tenía los atributos `[DbContext]`/`[Migration]` y **EF nunca la aplicaba**. Ahora es descubrible e idempotente. |
| `20261117000000_V121IntegridadYPrivacidad` | Converge cualquier base (nueva, creada con `RentCarDB.sql` o modificada a mano) al modelo v1.2.1. Ver detalle abajo. |

El snapshot `RentCarDbContextModelSnapshot.cs` fue regenerado con `dotnet-ef 10.0.15`; CI
verifica en cada ejecución que el modelo y el snapshot coinciden
(`dotnet ef migrations has-pending-model-changes`) y genera el script idempotente.

### V121IntegridadYPrivacidad

No elimina tablas, columnas ni registros. En orden:

1. **Columnas**: agrega las que falten (`EstadoOperacion`, `ImagenUrl`, `Subtotal`, `Itbis`,
   `Total`, `TipoTarjeta`, `TipoPersona`…) y renombra las columnas históricas de
   `Inspecciones` (`Id` → `IdTransaccion`, `EstadoGomas_D_D` → `GomaDelanteraDerecha`, etc.).
2. **Privacidad**: reduce `Clientes.NoTarjetaCR` a los **últimos 4 dígitos**, vacía
   `NombreTitularTarjeta` y `FechaExpiracionTarjeta` (si existen) y limita la columna a
   `varchar(4)` para que no pueda volver a guardar un número completo.
   ⚠️ Esta reducción es **irreversible**: los números completos no se pueden reconstruir.
3. **Normalización segura**: comentarios `NULL` → `''`, estado heredado `Abierta` → `Activa`,
   `No Disponible` → `NoDisponible`, y cálculo de Subtotal/ITBIS/Total para rentas antiguas
   que no lo tenían (ITBIS 18 %, redondeo a 2 decimales).
4. **Integridad**: claves foráneas, índices únicos (usuario y cédula de empleados, documento
   de clientes, placa y chasis de vehículos), **una sola renta activa por vehículo**
   (`UX_Rentas_IdVehiculo_Activa`) y restricciones `CHECK` de estados.

Si los datos existentes violan alguna restricción, la migración **se detiene y se revierte**
con un mensaje explícito (`THROW`). Nunca corrige ni borra datos en silencio.

| Código | Causa | Cómo resolverlo |
|---|---|---|
| 50001 | Valores duplicados en una columna que pasa a ser única (usuario, cédula, documento, placa, chasis o más de una renta activa por vehículo). | Localice los duplicados con `SELECT columna, COUNT(*) FROM tabla GROUP BY columna HAVING COUNT(*) > 1` y corríjalos. |
| 50002 | Referencias huérfanas (por ejemplo, una renta con `IdCliente` inexistente). | Corrija o restaure los registros referenciados. |
| 50003 | Estados fuera de `Activa/Concluida` o `Disponible/Rentado/NoDisponible`. | Normalice esos valores manualmente. |
| 50004 | `Empleados.Usuario` con más de 100 caracteres. | Acorte esos usuarios. |

## Antes de migrar una base existente: respaldo

```sql
BACKUP DATABASE [RentCarDB]
TO DISK = N'C:\Respaldos\RentCarDB_antes_v121.bak'
WITH INIT, CHECKSUM, STATS = 10;

RESTORE VERIFYONLY FROM DISK = N'C:\Respaldos\RentCarDB_antes_v121.bak' WITH CHECKSUM;
```

Para revisar exactamente qué se ejecutará, genere el script sin aplicarlo:

```powershell
cd RentCar.API/RentCar.API
dotnet ef migrations script --idempotent --output migraciones-v121.sql
```

Aplicar:

```powershell
dotnet ef database update
```

Para otra instancia distinta de LocalDB, defina la conexión que usan las herramientas de EF:

```powershell
$env:RENTCARRD_EF_CONNECTION = "Server=...;Database=RentCarDB;Trusted_Connection=True;TrustServerCertificate=True"
```

Restaurar el respaldo si fuera necesario:

```sql
USE master;
ALTER DATABASE [RentCarDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [RentCarDB] FROM DISK = N'C:\Respaldos\RentCarDB_antes_v121.bak' WITH REPLACE;
ALTER DATABASE [RentCarDB] SET MULTI_USER;
```

## Base nueva

```powershell
cd RentCar.API/RentCar.API
dotnet ef database update
$env:RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD = "<12 o más caracteres>"
$env:RENTCARRD_BOOTSTRAP_ADMIN_CEDULA = "<cédula dominicana válida>"
dotnet run --launch-profile https
Remove-Item Env:RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD, Env:RENTCARRD_BOOTSTRAP_ADMIN_CEDULA
```

## Verificación automatizada

Las pruebas de integración (`RentCar.API.Tests`) crean una base SQL Server aislada y
desechable por ejecución:

- `MigracionesTests` construye una base **histórica** con el esquema de `RentCarDB.sql`,
  datos de prueba que incluyen números de tarjeta completos ficticios, titular y expiración,
  aplica las migraciones y comprueba que solo quedan 4 dígitos, que los datos se conservan
  y que las restricciones existen; también verifica que una base con duplicados aborta.
- El resto de pruebas de integración aplica las migraciones sobre una base vacía.
