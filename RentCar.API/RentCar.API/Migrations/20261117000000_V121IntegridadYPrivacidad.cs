using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RentCar.API.Models;
using static RentCar.API.Migrations.SqlIdempotente;

#nullable disable

namespace RentCar.API.Migrations;

/// <summary>
/// RentCarRD v1.2.1 — integridad de datos y privacidad.
///
/// Idempotente y no destructiva respecto del esquema: no elimina tablas ni columnas.
/// RESPALDE LA BASE ANTES DE APLICARLA (ver docs/BASE_DE_DATOS.md).
///
/// 1. Convergencia de columnas: agrega las que falten en bases creadas con RentCarDB.sql
///    y renombra las columnas históricas de Inspecciones al nombre que usa la API.
/// 2. Privacidad: reduce NoTarjetaCR a los últimos 4 dígitos y vacía titular y expiración
///    (la intención original de AddEmpleadoPasswordHash, que nunca llegó a ejecutarse).
///    Las columnas NombreTitularTarjeta/FechaExpiracionTarjeta, si existen, se conservan vacías.
/// 3. Normalización segura: comentarios NULL → '', estado legado 'Abierta' → 'Activa',
///    desglose Subtotal/ITBIS/Total calculado para rentas antiguas que no lo tenían.
/// 4. Integridad: claves foráneas, índices únicos (usuario, cédulas, placa, chasis),
///    una sola renta activa por vehículo y restricciones CHECK de estados.
///    Si los datos existentes violan alguna, la migración se detiene con un mensaje claro
///    (THROW) y se revierte; no se modifica ni elimina información para forzarla.
/// </summary>
[DbContext(typeof(RentCarDbContext))]
[Migration("20261117000000_V121IntegridadYPrivacidad")]
public partial class V121IntegridadYPrivacidad : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        // ── 1. Convergencia de columnas ────────────────────────────────────────────────
        migrationBuilder.Sql(AgregarColumna("Vehiculos", "IdTipoCombustible", "int NULL"));
        migrationBuilder.Sql(AgregarColumna("Vehiculos", "IdCombustible", "int NULL"));
        migrationBuilder.Sql(AgregarColumna("Vehiculos", "ImagenUrl", "varchar(300) NULL"));
        migrationBuilder.Sql(AgregarColumna("Vehiculos", "EstadoOperacion",
            "varchar(20) NOT NULL CONSTRAINT [DF_Vehiculos_EstadoOperacion] DEFAULT 'Disponible'"));
        migrationBuilder.Sql(AgregarColumna("Clientes", "NoTarjetaCR", "varchar(4) NULL"));
        migrationBuilder.Sql(AgregarColumna("Clientes", "TipoTarjeta", "varchar(20) NULL"));
        migrationBuilder.Sql(AgregarColumna("Clientes", "TipoPersona", "varchar(20) NULL"));
        migrationBuilder.Sql(AgregarColumna("Rentas", "Subtotal", "decimal(18,2) NOT NULL CONSTRAINT [DF_Rentas_Subtotal] DEFAULT 0"));
        migrationBuilder.Sql(AgregarColumna("Rentas", "Itbis", "decimal(18,2) NOT NULL CONSTRAINT [DF_Rentas_Itbis] DEFAULT 0"));
        migrationBuilder.Sql(AgregarColumna("Rentas", "Total", "decimal(18,2) NOT NULL CONSTRAINT [DF_Rentas_Total] DEFAULT 0"));

        migrationBuilder.Sql(RenombrarColumna("Inspecciones", "Id", "IdTransaccion"));
        migrationBuilder.Sql(RenombrarColumna("Inspecciones", "EstadoGomas_D_D", "GomaDelanteraDerecha"));
        migrationBuilder.Sql(RenombrarColumna("Inspecciones", "EstadoGomas_D_I", "GomaDelanteraIzquierda"));
        migrationBuilder.Sql(RenombrarColumna("Inspecciones", "EstadoGomas_T_D", "GomaTraseraDerecha"));
        migrationBuilder.Sql(RenombrarColumna("Inspecciones", "EstadoGomas_T_I", "GomaTraseraIzquierda"));

        // ── 2. Privacidad de datos de pago ─────────────────────────────────────────────
        migrationBuilder.Sql(SiExistenColumnas("Clientes", ["NoTarjetaCR"], """
            UPDATE [dbo].[Clientes]
            SET [NoTarjetaCR] = CASE
                    WHEN LEN(REPLACE(REPLACE(LTRIM(RTRIM([NoTarjetaCR])), ' ', ''), '-', '')) = 0 THEN NULL
                    ELSE RIGHT(REPLACE(REPLACE(LTRIM(RTRIM([NoTarjetaCR])), ' ', ''), '-', ''), 4)
                END
            WHERE [NoTarjetaCR] IS NOT NULL
              AND LEN(REPLACE(REPLACE(LTRIM(RTRIM([NoTarjetaCR])), ' ', ''), '-', '')) <> 4;
            """));
        migrationBuilder.Sql(SiExistenColumnas("Clientes", ["NombreTitularTarjeta"],
            "UPDATE [dbo].[Clientes] SET [NombreTitularTarjeta] = NULL WHERE [NombreTitularTarjeta] IS NOT NULL;"));
        migrationBuilder.Sql(SiExistenColumnas("Clientes", ["FechaExpiracionTarjeta"],
            "UPDATE [dbo].[Clientes] SET [FechaExpiracionTarjeta] = NULL WHERE [FechaExpiracionTarjeta] IS NOT NULL;"));
        // Con los datos ya reducidos, la columna no puede volver a almacenar un número completo.
        migrationBuilder.Sql(CambiarTipo("Clientes", "NoTarjetaCR", "varchar(4) NULL", null,
            "COL_LENGTH(N'dbo.Clientes', N'NoTarjetaCR') <> 4"));

        // ── 3. Normalización segura de datos históricos ────────────────────────────────
        migrationBuilder.Sql("UPDATE [dbo].[Rentas] SET [Comentario] = N'' WHERE [Comentario] IS NULL;");
        migrationBuilder.Sql("UPDATE [dbo].[Rentas] SET [Estado] = 'Activa' WHERE [Estado] = 'Abierta';");
        migrationBuilder.Sql("""
            UPDATE [dbo].[Rentas]
            SET [Subtotal] = ROUND([MontoXDia] * [CantidadDias], 2),
                [Itbis] = ROUND(ROUND([MontoXDia] * [CantidadDias], 2) * 0.18, 2),
                [Total] = ROUND([MontoXDia] * [CantidadDias], 2) + ROUND(ROUND([MontoXDia] * [CantidadDias], 2) * 0.18, 2)
            WHERE ([Subtotal] IS NULL OR [Subtotal] = 0)
              AND [MontoXDia] IS NOT NULL AND [CantidadDias] IS NOT NULL
              AND [MontoXDia] * [CantidadDias] > 0;
            """);
        migrationBuilder.Sql("""
            UPDATE [dbo].[Vehiculos]
            SET [EstadoOperacion] = CASE WHEN [Estado] = 1 THEN 'Disponible' ELSE 'Rentado' END
            WHERE [EstadoOperacion] IS NULL OR LTRIM(RTRIM([EstadoOperacion])) = '';
            """);
        migrationBuilder.Sql("UPDATE [dbo].[Vehiculos] SET [EstadoOperacion] = 'NoDisponible' WHERE [EstadoOperacion] = 'No Disponible';");

        // Usuario: de nvarchar(max) (migración histórica) a varchar(100) para poder indexarlo.
        migrationBuilder.Sql("""
            IF EXISTS (SELECT 1 FROM [dbo].[Empleados] WHERE LEN([Usuario]) > 100)
                THROW 50004, N'Empleados.Usuario contiene valores de más de 100 caracteres. Acórtelos antes de aplicar la migración.', 1;
            """);
        migrationBuilder.Sql(CambiarTipo("Empleados", "Usuario", "varchar(100) NOT NULL", "''",
            "COL_LENGTH(N'dbo.Empleados', N'Usuario') = -1 OR TYPE_NAME((SELECT system_type_id FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Empleados') AND name = N'Usuario')) <> 'varchar'"));

        // ── 4. Integridad ──────────────────────────────────────────────────────────────
        migrationBuilder.Sql(Check("Rentas", "CK_Rentas_Estado",
            "[Estado] IN ('Activa', 'Concluida')",
            "[Estado] IS NOT NULL AND [Estado] NOT IN ('Activa', 'Concluida')",
            "Rentas.Estado contiene valores distintos de Activa/Concluida. Revíselos antes de aplicar la migración."));
        migrationBuilder.Sql(Check("Vehiculos", "CK_Vehiculos_EstadoOperacion",
            "[EstadoOperacion] IN ('Disponible', 'Rentado', 'NoDisponible')",
            "[EstadoOperacion] NOT IN ('Disponible', 'Rentado', 'NoDisponible')",
            "Vehiculos.EstadoOperacion contiene valores no válidos. Revíselos antes de aplicar la migración."));

        migrationBuilder.Sql(IndiceUnico("Empleados", "Usuario", "IX_Empleados_Usuario", null,
            "Hay usuarios de empleados duplicados. Corríjalos antes de aplicar la migración."));
        migrationBuilder.Sql(IndiceUnico("Empleados", "Cedula", "IX_Empleados_Cedula", null,
            "Hay cédulas de empleados duplicadas. Corríjalas antes de aplicar la migración."));
        migrationBuilder.Sql(IndiceUnico("Clientes", "Cedula", "IX_Clientes_Cedula", null,
            "Hay documentos de clientes duplicados. Corríjalos antes de aplicar la migración."));
        migrationBuilder.Sql(IndiceUnico("Vehiculos", "NoPlaca", "IX_Vehiculos_NoPlaca", "[NoPlaca] IS NOT NULL",
            "Hay placas de vehículos duplicadas. Corríjalas antes de aplicar la migración."));
        migrationBuilder.Sql(IndiceUnico("Vehiculos", "NoChasis", "IX_Vehiculos_NoChasis", "[NoChasis] IS NOT NULL",
            "Hay números de chasis duplicados. Corríjalos antes de aplicar la migración."));
        migrationBuilder.Sql(IndiceUnico("Rentas", "IdVehiculo", "UX_Rentas_IdVehiculo_Activa", "[Estado] = 'Activa'",
            "Hay vehículos con más de una renta activa. Concluya o corrija esas rentas antes de aplicar la migración."));

        migrationBuilder.Sql(ClaveForanea("Modelos", "IdMarca", "Marcas"));
        migrationBuilder.Sql(ClaveForanea("Vehiculos", "IdMarca", "Marcas"));
        migrationBuilder.Sql(ClaveForanea("Vehiculos", "IdModelo", "Modelos"));
        migrationBuilder.Sql(ClaveForanea("Vehiculos", "IdTipoVehiculo", "TiposVehiculos"));
        migrationBuilder.Sql(ClaveForanea("Vehiculos", "IdTipoCombustible", "TiposCombustibles"));
        migrationBuilder.Sql(ClaveForanea("Rentas", "IdEmpleado", "Empleados"));
        migrationBuilder.Sql(ClaveForanea("Rentas", "IdVehiculo", "Vehiculos"));
        migrationBuilder.Sql(ClaveForanea("Rentas", "IdCliente", "Clientes"));
        migrationBuilder.Sql(ClaveForanea("Inspecciones", "IdVehiculo", "Vehiculos"));
        migrationBuilder.Sql(ClaveForanea("Inspecciones", "IdCliente", "Clientes"));
        migrationBuilder.Sql(ClaveForanea("Inspecciones", "IdEmpleadoInspeccion", "Empleados"));

        foreach (var (tabla, columna) in new[]
                 {
                     ("Modelos", "IdMarca"), ("Vehiculos", "IdMarca"), ("Vehiculos", "IdModelo"),
                     ("Vehiculos", "IdTipoVehiculo"), ("Vehiculos", "IdTipoCombustible"),
                     ("Rentas", "IdEmpleado"), ("Rentas", "IdCliente"),
                     ("Inspecciones", "IdVehiculo"), ("Inspecciones", "IdCliente"), ("Inspecciones", "IdEmpleadoInspeccion")
                 })
        {
            migrationBuilder.Sql(IndiceSimple(tabla, columna));
        }
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Solo se retiran las restricciones añadidas; los datos de pago reducidos no se pueden
        // ni se deben reconstruir.
        migrationBuilder.Sql("IF OBJECT_ID(N'dbo.CK_Rentas_Estado', N'C') IS NOT NULL ALTER TABLE [dbo].[Rentas] DROP CONSTRAINT [CK_Rentas_Estado];");
        migrationBuilder.Sql("IF OBJECT_ID(N'dbo.CK_Vehiculos_EstadoOperacion', N'C') IS NOT NULL ALTER TABLE [dbo].[Vehiculos] DROP CONSTRAINT [CK_Vehiculos_EstadoOperacion];");
        migrationBuilder.Sql("IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UX_Rentas_IdVehiculo_Activa' AND object_id = OBJECT_ID(N'dbo.Rentas')) DROP INDEX [UX_Rentas_IdVehiculo_Activa] ON [dbo].[Rentas];");
    }
}
