using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RentCar.API.Models;

#nullable disable

namespace RentCar.API.Migrations;

/// <summary>
/// Esquema base de RentCarRD (v1.2.1).
///
/// Hasta v1.2 las tablas se creaban con el script manual RentCarDB.sql y las migraciones
/// solo añadían columnas, por lo que "dotnet ef database update" fallaba en una base vacía.
/// Esta migración crea cada tabla únicamente si no existe:
/// - En una base nueva, crea el esquema completo.
/// - En una base existente (creada con el script o a mano), no hace nada; las migraciones
///   posteriores agregan lo que falte.
/// Tiene un identificador anterior a las migraciones históricas para ejecutarse primero.
/// </summary>
[DbContext(typeof(RentCarDbContext))]
[Migration("20260601000000_EsquemaBase")]
public partial class EsquemaBase : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.Marcas', N'U') IS NULL
            CREATE TABLE [dbo].[Marcas] (
                [Id] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Marcas] PRIMARY KEY,
                [Descripcion] varchar(100) NULL,
                [Estado] bit NULL CONSTRAINT [DF_Marcas_Estado] DEFAULT CAST(1 AS bit));
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.TiposVehiculos', N'U') IS NULL
            CREATE TABLE [dbo].[TiposVehiculos] (
                [Id] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_TiposVehiculos] PRIMARY KEY,
                [Descripcion] varchar(100) NULL,
                [Estado] bit NULL CONSTRAINT [DF_TiposVehiculos_Estado] DEFAULT CAST(1 AS bit));
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.TiposCombustibles', N'U') IS NULL
            CREATE TABLE [dbo].[TiposCombustibles] (
                [Id] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_TiposCombustibles] PRIMARY KEY,
                [Descripcion] varchar(100) NULL,
                [Estado] bit NULL CONSTRAINT [DF_TiposCombustibles_Estado] DEFAULT CAST(1 AS bit));
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.Modelos', N'U') IS NULL
            CREATE TABLE [dbo].[Modelos] (
                [Id] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Modelos] PRIMARY KEY,
                [IdMarca] int NULL CONSTRAINT [FK_Modelos_Marcas_IdMarca] REFERENCES [dbo].[Marcas]([Id]),
                [Descripcion] varchar(100) NULL,
                [Estado] bit NULL CONSTRAINT [DF_Modelos_Estado] DEFAULT CAST(1 AS bit));
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.Vehiculos', N'U') IS NULL
            CREATE TABLE [dbo].[Vehiculos] (
                [Id] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Vehiculos] PRIMARY KEY,
                [Descripcion] nvarchar(200) NULL,
                [NoChasis] varchar(17) NULL,
                [NoMotor] varchar(50) NULL,
                [NoPlaca] varchar(7) NULL,
                [IdTipoVehiculo] int NULL,
                [IdMarca] int NULL,
                [IdModelo] int NULL,
                [IdTipoCombustible] int NULL,
                [IdCombustible] int NULL,
                [Estado] bit NULL CONSTRAINT [DF_Vehiculos_Estado] DEFAULT CAST(1 AS bit),
                [EstadoOperacion] varchar(20) NOT NULL CONSTRAINT [DF_Vehiculos_EstadoOperacion] DEFAULT 'Disponible',
                [ImagenUrl] varchar(300) NULL);
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.Clientes', N'U') IS NULL
            CREATE TABLE [dbo].[Clientes] (
                [Id] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Clientes] PRIMARY KEY,
                [Nombre] varchar(150) NOT NULL,
                [Cedula] varchar(11) NOT NULL,
                [NoTarjetaCR] varchar(4) NULL,
                [TipoTarjeta] varchar(20) NULL,
                [LimiteCredito] decimal(18,2) NOT NULL CONSTRAINT [DF_Clientes_LimiteCredito] DEFAULT 0,
                [TipoPersona] varchar(20) NULL,
                [Estado] bit NOT NULL CONSTRAINT [DF_Clientes_Estado] DEFAULT CAST(1 AS bit));
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.Empleados', N'U') IS NULL
            CREATE TABLE [dbo].[Empleados] (
                [Id] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Empleados] PRIMARY KEY,
                [Nombre] nvarchar(150) NOT NULL,
                [Cedula] varchar(11) NOT NULL,
                [TandaLabor] varchar(20) NOT NULL,
                [PorcientoComision] int NOT NULL,
                [FechaIngreso] datetime2 NOT NULL,
                [Estado] bit NOT NULL CONSTRAINT [DF_Empleados_Estado] DEFAULT CAST(1 AS bit),
                [Usuario] varchar(100) NOT NULL CONSTRAINT [DF_Empleados_Usuario] DEFAULT '',
                [PasswordHash] nvarchar(512) NOT NULL CONSTRAINT [DF_Empleados_PasswordHash] DEFAULT N'');
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.Inspecciones', N'U') IS NULL
            CREATE TABLE [dbo].[Inspecciones] (
                [IdTransaccion] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Inspecciones] PRIMARY KEY,
                [IdVehiculo] int NOT NULL,
                [IdCliente] int NOT NULL,
                [TieneRalladuras] bit NOT NULL,
                [CantidadCombustible] varchar(20) NOT NULL,
                [TieneGomaRespuesta] bit NOT NULL,
                [TieneGato] bit NOT NULL,
                [TieneRoturasCristal] bit NOT NULL,
                [GomaDelanteraDerecha] bit NOT NULL,
                [GomaDelanteraIzquierda] bit NOT NULL,
                [GomaTraseraDerecha] bit NOT NULL,
                [GomaTraseraIzquierda] bit NOT NULL,
                [Fecha] datetime2 NOT NULL,
                [IdEmpleadoInspeccion] int NOT NULL,
                [Estado] bit NOT NULL CONSTRAINT [DF_Inspecciones_Estado] DEFAULT CAST(1 AS bit));
            """);

        migrationBuilder.Sql("""
            IF OBJECT_ID(N'dbo.Rentas', N'U') IS NULL
            CREATE TABLE [dbo].[Rentas] (
                [NoRenta] int IDENTITY(1,1) NOT NULL CONSTRAINT [PK_Rentas] PRIMARY KEY,
                [IdEmpleado] int NOT NULL,
                [IdVehiculo] int NOT NULL,
                [IdCliente] int NOT NULL,
                [FechaRenta] datetime2 NOT NULL,
                [FechaDevolucion] datetime2 NULL,
                [MontoXDia] decimal(18,2) NOT NULL,
                [CantidadDias] int NOT NULL,
                [Subtotal] decimal(18,2) NOT NULL CONSTRAINT [DF_Rentas_Subtotal] DEFAULT 0,
                [Itbis] decimal(18,2) NOT NULL CONSTRAINT [DF_Rentas_Itbis] DEFAULT 0,
                [Total] decimal(18,2) NOT NULL CONSTRAINT [DF_Rentas_Total] DEFAULT 0,
                [Comentario] nvarchar(1000) NOT NULL CONSTRAINT [DF_Rentas_Comentario] DEFAULT N'',
                [Estado] varchar(20) NOT NULL CONSTRAINT [DF_Rentas_Estado] DEFAULT 'Activa');
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        // Intencionalmente vacío: revertir el esquema base implicaría borrar tablas con datos.
    }
}
