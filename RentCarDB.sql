/*
  RentCarRD - esquema seguro e idempotente

  Este script no elimina datos, no crea usuarios con contraseñas conocidas y no
  almacena información de tarjetas. Puede ejecutarse varias veces sobre SQL Server.
  Las credenciales de acceso se crean desde la API usando User Secrets; consulte
  el README antes de iniciar la aplicación.
*/

IF DB_ID(N'RentCarDB') IS NULL
BEGIN
    CREATE DATABASE RentCarDB;
END;
GO

USE RentCarDB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.TiposVehiculos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TiposVehiculos
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TiposVehiculos PRIMARY KEY,
        Descripcion VARCHAR(100) NOT NULL,
        Estado BIT NOT NULL CONSTRAINT DF_TiposVehiculos_Estado DEFAULT (1)
    );
END;
GO

IF OBJECT_ID(N'dbo.Marcas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Marcas
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Marcas PRIMARY KEY,
        Descripcion VARCHAR(100) NOT NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Marcas_Estado DEFAULT (1)
    );
END;
GO

IF OBJECT_ID(N'dbo.Modelos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Modelos
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Modelos PRIMARY KEY,
        IdMarca INT NOT NULL,
        Descripcion VARCHAR(100) NOT NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Modelos_Estado DEFAULT (1),
        CONSTRAINT FK_Modelos_Marcas FOREIGN KEY (IdMarca) REFERENCES dbo.Marcas(Id)
    );
END;
GO

IF OBJECT_ID(N'dbo.TiposCombustibles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TiposCombustibles
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TiposCombustibles PRIMARY KEY,
        Descripcion VARCHAR(100) NOT NULL,
        Estado BIT NOT NULL CONSTRAINT DF_TiposCombustibles_Estado DEFAULT (1)
    );
END;
GO

IF OBJECT_ID(N'dbo.Clientes', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Clientes
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Clientes PRIMARY KEY,
        Nombre VARCHAR(150) NOT NULL,
        Cedula VARCHAR(11) NOT NULL,
        LimiteCredito DECIMAL(18,2) NOT NULL,
        TipoPersona VARCHAR(20) NOT NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Clientes_Estado DEFAULT (1),
        CONSTRAINT UX_Clientes_Cedula UNIQUE (Cedula),
        CONSTRAINT CK_Clientes_LimiteCredito CHECK (LimiteCredito >= 0),
        CONSTRAINT CK_Clientes_TipoPersona CHECK (TipoPersona IN ('Fisica', 'Juridica'))
    );
END;
GO

IF OBJECT_ID(N'dbo.Empleados', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Empleados
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Empleados PRIMARY KEY,
        Nombre NVARCHAR(150) NOT NULL,
        Cedula VARCHAR(11) NOT NULL,
        Usuario VARCHAR(100) NOT NULL,
        Rol VARCHAR(30) NOT NULL CONSTRAINT DF_Empleados_Rol DEFAULT ('Empleado'),
        PasswordHash VARCHAR(500) NULL,
        TandaLabor NVARCHAR(80) NOT NULL,
        PorcientoComision INT NOT NULL,
        FechaIngreso DATETIME2 NOT NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Empleados_Estado DEFAULT (1),
        CONSTRAINT UX_Empleados_Cedula UNIQUE (Cedula),
        CONSTRAINT UX_Empleados_Usuario UNIQUE (Usuario),
        CONSTRAINT CK_Empleados_Rol CHECK (Rol IN ('Administrador', 'Empleado')),
        CONSTRAINT CK_Empleados_Comision CHECK (PorcientoComision BETWEEN 0 AND 100)
    );
END;
GO

IF OBJECT_ID(N'dbo.Vehiculos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Vehiculos
    (
        Id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Vehiculos PRIMARY KEY,
        Descripcion NVARCHAR(200) NOT NULL,
        NoChasis VARCHAR(17) NULL,
        NoMotor VARCHAR(50) NULL,
        NoPlaca VARCHAR(7) NOT NULL,
        IdTipoVehiculo INT NOT NULL,
        IdMarca INT NOT NULL,
        IdModelo INT NOT NULL,
        IdTipoCombustible INT NOT NULL,
        IdCombustible INT NULL,
        Estado BIT NOT NULL CONSTRAINT DF_Vehiculos_Estado DEFAULT (1),
        EstadoOperacion VARCHAR(20) NOT NULL
            CONSTRAINT DF_Vehiculos_EstadoOperacion DEFAULT ('Disponible'),
        ImagenUrl VARCHAR(300) NULL,
        CONSTRAINT UX_Vehiculos_NoPlaca UNIQUE (NoPlaca),
        CONSTRAINT FK_Vehiculos_TiposVehiculos FOREIGN KEY (IdTipoVehiculo)
            REFERENCES dbo.TiposVehiculos(Id),
        CONSTRAINT FK_Vehiculos_Marcas FOREIGN KEY (IdMarca) REFERENCES dbo.Marcas(Id),
        CONSTRAINT FK_Vehiculos_Modelos FOREIGN KEY (IdModelo) REFERENCES dbo.Modelos(Id),
        CONSTRAINT FK_Vehiculos_TiposCombustibles FOREIGN KEY (IdTipoCombustible)
            REFERENCES dbo.TiposCombustibles(Id),
        CONSTRAINT CK_Vehiculos_EstadoOperacion
            CHECK (EstadoOperacion IN ('Disponible', 'Rentado', 'NoDisponible'))
    );

    CREATE UNIQUE INDEX UX_Vehiculos_NoChasis
        ON dbo.Vehiculos(NoChasis)
        WHERE NoChasis IS NOT NULL;
END;
GO

IF OBJECT_ID(N'dbo.Inspecciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Inspecciones
    (
        IdTransaccion INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Inspecciones PRIMARY KEY,
        IdVehiculo INT NOT NULL,
        IdCliente INT NOT NULL,
        TieneRalladuras BIT NOT NULL,
        CantidadCombustible NVARCHAR(20) NOT NULL,
        TieneGomaRespuesta BIT NOT NULL,
        TieneGato BIT NOT NULL,
        TieneRoturasCristal BIT NOT NULL,
        GomaDelanteraDerecha BIT NOT NULL,
        GomaDelanteraIzquierda BIT NOT NULL,
        GomaTraseraDerecha BIT NOT NULL,
        GomaTraseraIzquierda BIT NOT NULL,
        Fecha DATETIME2 NOT NULL,
        IdEmpleadoInspeccion INT NOT NULL,
        Estado BIT NOT NULL,
        CONSTRAINT FK_Inspecciones_Vehiculos FOREIGN KEY (IdVehiculo)
            REFERENCES dbo.Vehiculos(Id),
        CONSTRAINT FK_Inspecciones_Clientes FOREIGN KEY (IdCliente)
            REFERENCES dbo.Clientes(Id),
        CONSTRAINT FK_Inspecciones_Empleados FOREIGN KEY (IdEmpleadoInspeccion)
            REFERENCES dbo.Empleados(Id),
        CONSTRAINT CK_Inspecciones_Combustible
            CHECK (CantidadCombustible IN ('1/4', '1/2', '3/4', 'Lleno'))
    );
END;
GO

IF OBJECT_ID(N'dbo.Rentas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Rentas
    (
        NoRenta INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Rentas PRIMARY KEY,
        IdEmpleado INT NOT NULL,
        IdVehiculo INT NOT NULL,
        IdCliente INT NOT NULL,
        FechaRenta DATETIME2 NOT NULL,
        FechaDevolucion DATETIME2 NULL,
        MontoXDia DECIMAL(18,2) NOT NULL,
        CantidadDias INT NOT NULL,
        Subtotal DECIMAL(18,2) NOT NULL,
        Itbis DECIMAL(18,2) NOT NULL,
        Total DECIMAL(18,2) NOT NULL,
        Comentario NVARCHAR(1000) NOT NULL CONSTRAINT DF_Rentas_Comentario DEFAULT (N''),
        Estado VARCHAR(20) NOT NULL CONSTRAINT DF_Rentas_Estado DEFAULT ('Activa'),
        CONSTRAINT FK_Rentas_Empleados FOREIGN KEY (IdEmpleado) REFERENCES dbo.Empleados(Id),
        CONSTRAINT FK_Rentas_Vehiculos FOREIGN KEY (IdVehiculo) REFERENCES dbo.Vehiculos(Id),
        CONSTRAINT FK_Rentas_Clientes FOREIGN KEY (IdCliente) REFERENCES dbo.Clientes(Id),
        CONSTRAINT UX_Rentas_IdVehiculo UNIQUE (IdVehiculo),
        CONSTRAINT CK_Rentas_Monto CHECK (MontoXDia > 0),
        CONSTRAINT CK_Rentas_Dias CHECK (CantidadDias BETWEEN 1 AND 3650),
        CONSTRAINT CK_Rentas_Estado CHECK (Estado IN ('Activa', 'Concluida'))
    );
END;
GO

/* Elimina columnas heredadas que contenían datos de pago en texto claro. */
IF COL_LENGTH('dbo.Clientes', 'NoTarjetaCR') IS NOT NULL
    ALTER TABLE dbo.Clientes DROP COLUMN NoTarjetaCR;
GO

IF COL_LENGTH('dbo.Clientes', 'NombreTitularTarjeta') IS NOT NULL
    ALTER TABLE dbo.Clientes DROP COLUMN NombreTitularTarjeta;
GO

IF COL_LENGTH('dbo.Clientes', 'FechaExpiracionTarjeta') IS NOT NULL
    ALTER TABLE dbo.Clientes DROP COLUMN FechaExpiracionTarjeta;
GO

IF COL_LENGTH('dbo.Clientes', 'TipoTarjeta') IS NOT NULL
    ALTER TABLE dbo.Clientes DROP COLUMN TipoTarjeta;
GO

IF COL_LENGTH('dbo.Empleados', 'Usuario') IS NULL
    ALTER TABLE dbo.Empleados ADD Usuario VARCHAR(100) NULL;
GO

IF COL_LENGTH('dbo.Empleados', 'PasswordHash') IS NULL
    ALTER TABLE dbo.Empleados ADD PasswordHash VARCHAR(500) NULL;
GO

IF COL_LENGTH('dbo.Empleados', 'Rol') IS NULL
    ALTER TABLE dbo.Empleados ADD Rol VARCHAR(30) NOT NULL
        CONSTRAINT DF_Empleados_Rol DEFAULT ('Empleado');
GO

UPDATE dbo.Empleados
SET Usuario = CONCAT('empleado-', Id)
WHERE Usuario IS NULL OR LTRIM(RTRIM(Usuario)) = '';
GO

UPDATE dbo.Empleados
SET Usuario = CONCAT(LEFT(LOWER(LTRIM(RTRIM(Usuario))), 88), '-', Id)
WHERE LEN(Usuario) > 100;
GO

;WITH UsuariosDuplicados AS
(
    SELECT Id,
           ROW_NUMBER() OVER (PARTITION BY LOWER(Usuario) ORDER BY Id) AS Numero
    FROM dbo.Empleados
)
UPDATE empleado
SET Usuario = CONCAT(LEFT(empleado.Usuario, 88), '-', empleado.Id)
FROM dbo.Empleados AS empleado
INNER JOIN UsuariosDuplicados AS duplicado ON duplicado.Id = empleado.Id
WHERE duplicado.Numero > 1;
GO

ALTER TABLE dbo.Empleados ALTER COLUMN Usuario VARCHAR(100) NOT NULL;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_Empleados_Usuario'
      AND object_id = OBJECT_ID('dbo.Empleados')
)
    CREATE UNIQUE INDEX UX_Empleados_Usuario ON dbo.Empleados(Usuario);
GO

IF EXISTS
(
    SELECT IdVehiculo
    FROM dbo.Rentas
    GROUP BY IdVehiculo
    HAVING COUNT(*) > 1
)
    THROW 51000, 'No se puede proteger Rentas: existen vehículos rentados más de una vez.', 1;
GO

IF NOT EXISTS
(
    SELECT 1 FROM sys.indexes
    WHERE name = 'UX_Rentas_IdVehiculo'
      AND object_id = OBJECT_ID('dbo.Rentas')
)
    CREATE UNIQUE INDEX UX_Rentas_IdVehiculo ON dbo.Rentas(IdVehiculo);
GO

PRINT 'Esquema RentCarDB verificado. No se crearon credenciales ni se eliminaron registros.';
GO
