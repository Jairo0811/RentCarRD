CREATE DATABASE RentCarDB;
GO
USE RentCarDB;

-- 1. Tablas Maestras
CREATE TABLE TiposVehiculos (
    Id INT PRIMARY KEY IDENTITY,
    Descripcion VARCHAR(100),
    Estado BIT DEFAULT 1 -- 1: Activo, 0: Inactivo
);

CREATE TABLE Marcas (
    Id INT PRIMARY KEY IDENTITY,
    Descripcion VARCHAR(100),
    Estado BIT DEFAULT 1
);

CREATE TABLE Modelos (
    Id INT PRIMARY KEY IDENTITY,
    IdMarca INT FOREIGN KEY REFERENCES Marcas(Id),
    Descripcion VARCHAR(100),
    Estado BIT DEFAULT 1
);

CREATE TABLE TiposCombustibles (
    Id INT PRIMARY KEY IDENTITY,
    Descripcion VARCHAR(100),
    Estado BIT DEFAULT 1
);

-- 2. Entidades Principales
CREATE TABLE Vehiculos (
    Id INT PRIMARY KEY IDENTITY,
    Descripcion VARCHAR(200),
    NoChasis VARCHAR(50),
    NoMotor VARCHAR(50),
    NoPlaca VARCHAR(20),
    IdTipoVehiculo INT FOREIGN KEY REFERENCES TiposVehiculos(Id),
    IdMarca INT FOREIGN KEY REFERENCES Marcas(Id),
    IdModelo INT FOREIGN KEY REFERENCES Modelos(Id),
    IdTipoCombustible INT FOREIGN KEY REFERENCES TiposCombustibles(Id),
    Estado BIT DEFAULT 1 -- 1: Disponible, 0: Rentado/Mantenimiento
);

CREATE TABLE Clientes (
    Id INT PRIMARY KEY IDENTITY,
    Nombre VARCHAR(100),
    Cedula VARCHAR(11) UNIQUE,
    NoTarjetaCR VARCHAR(20),
    LimiteCredito DECIMAL(18,2),
    TipoPersona VARCHAR(20), -- Fisica / Juridica
    Estado BIT DEFAULT 1
);

CREATE TABLE Empleados (
    Id INT PRIMARY KEY IDENTITY,
    Nombre VARCHAR(100),
    Cedula VARCHAR(11) UNIQUE,
    TandaLabor VARCHAR(20), -- Matutina, Vespertina, Nocturna
    PorcientoComision INT,
    FechaIngreso DATE,
    Estado BIT DEFAULT 1
);

-- 3. Procesos
CREATE TABLE Inspecciones (
    Id INT PRIMARY KEY IDENTITY,
    IdVehiculo INT FOREIGN KEY REFERENCES Vehiculos(Id),
    IdCliente INT FOREIGN KEY REFERENCES Clientes(Id),
    TieneRalladuras BIT,
    CantidadCombustible VARCHAR(20), -- 1/4, 1/2, 3/4, Lleno
    TieneGomaRespuesta BIT,
    TieneGato BIT,
    TieneRoturasCristal BIT,
    EstadoGomas_D_D BIT, -- Delantera Derecha
    EstadoGomas_D_I BIT, -- Delantera Izquierda
    EstadoGomas_T_D BIT, -- Trasera Derecha
    EstadoGomas_T_I BIT, -- Trasera Izquierda
    Fecha DATE DEFAULT GETDATE(),
    IdEmpleadoInspeccion INT FOREIGN KEY REFERENCES Empleados(Id),
    Estado BIT DEFAULT 1
);

CREATE TABLE Rentas (
    NoRenta INT PRIMARY KEY IDENTITY,
    IdEmpleado INT FOREIGN KEY REFERENCES Empleados(Id),
    IdVehiculo INT FOREIGN KEY REFERENCES Vehiculos(Id),
    IdCliente INT FOREIGN KEY REFERENCES Clientes(Id),
    FechaRenta DATE,
    FechaDevolucion DATE,
    MontoXDia DECIMAL(18,2),
    CantidadDias INT,
    Comentario TEXT,
    Estado VARCHAR(20) DEFAULT 'Activa' -- Activa, Concluida
);


USE RentCarDB;

INSERT INTO Empleados (Nombre, Cedula, TandaLabor, PorcientoComision, FechaIngreso, Estado)
VALUES ('Administrador General', '000-0000000-1', 'Matutina', 10, GETDATE(), 1);

SELECT * FROM Empleados;


IF NOT EXISTS (SELECT 1 FROM Marcas WHERE Id = 1)
INSERT INTO Marcas (Descripcion, Estado) VALUES ('Toyota', 1);

IF NOT EXISTS (SELECT 1 FROM Modelos WHERE Id = 1)
INSERT INTO Modelos (IdMarca, Descripcion, Estado) VALUES (1, 'Corolla', 1);

IF NOT EXISTS (SELECT 1 FROM TiposVehiculos WHERE Id = 1)
INSERT INTO TiposVehiculos (Descripcion, Estado) VALUES ('Sedán', 1);

IF NOT EXISTS (SELECT 1 FROM TiposCombustibles WHERE Id = 1)
INSERT INTO TiposCombustibles (Descripcion, Estado) VALUES ('Gasolina', 1);

SELECT TOP 1 * FROM Vehiculos;


USE RentCarDB;
GO

SELECT 
    COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Vehiculos';


USE RentCarDB;
GO

ALTER TABLE Vehiculos
ADD IdTipoCombustible INT NULL;
GO

ALTER TABLE Vehiculos
ADD CONSTRAINT FK_Vehiculos_TiposCombustibles
FOREIGN KEY (IdTipoCombustible) REFERENCES TiposCombustibles(Id);
GO

USE RentCarDB;
GO

ALTER TABLE Vehiculos
ADD IdTipoCombustible INT NULL;
GO

ALTER TABLE Vehiculos
ADD CONSTRAINT FK_Vehiculos_TiposCombustibles
FOREIGN KEY (IdTipoCombustible) REFERENCES TiposCombustibles(Id);
GO



USE RentCarDB;
GO

SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Vehiculos';


USE RentCarDB;
GO

IF COL_LENGTH('Vehiculos', 'ImagenUrl') IS NULL
BEGIN
    ALTER TABLE Vehiculos
    ADD ImagenUrl VARCHAR(300) NULL;
END
GO


USE RentCarDB;
GO

IF COL_LENGTH('Vehiculos', 'ImagenUrl') IS NULL
BEGIN
    ALTER TABLE Vehiculos
    ADD ImagenUrl VARCHAR(300) NULL;
END
GO

SELECT Id, ImagenUrl
FROM Vehiculos;


USE RentCarDB;
GO

SELECT * FROM Rentas WHERE NoRenta = 2;

SELECT * FROM Clientes;

SELECT * FROM Vehiculos;



SELECT Id, Nombre, Cedula, Usuario
FROM Empleados;



USE RentCarDB;
GO

BEGIN TRANSACTION;

BEGIN TRY

    DELETE FROM Inspecciones;
    DELETE FROM Rentas;
    DELETE FROM Clientes;
    DELETE FROM Empleados;
    DELETE FROM Vehiculos;

    DBCC CHECKIDENT ('Inspecciones', RESEED, 0);
    DBCC CHECKIDENT ('Rentas', RESEED, 0);
    DBCC CHECKIDENT ('Clientes', RESEED, 0);
    DBCC CHECKIDENT ('Empleados', RESEED, 0);
    DBCC CHECKIDENT ('Vehiculos', RESEED, 0);

    COMMIT TRANSACTION;

    PRINT 'Datos operativos eliminados correctamente.';

END TRY
BEGIN CATCH

    ROLLBACK TRANSACTION;

    PRINT ERROR_MESSAGE();

END CATCH;
GO




USE RentCarDB;
GO

/* Nombre del titular */
IF COL_LENGTH('Clientes', 'NombreTitularTarjeta') IS NULL
BEGIN
    ALTER TABLE Clientes
    ADD NombreTitularTarjeta VARCHAR(120) NULL;
END
GO

/* Fecha de expiración en formato MM/AA */
IF COL_LENGTH('Clientes', 'FechaExpiracionTarjeta') IS NULL
BEGIN
    ALTER TABLE Clientes
    ADD FechaExpiracionTarjeta VARCHAR(5) NULL;
END
GO

/* Franquicia detectada: VISA, MASTERCARD, AMEX, DISCOVER */
IF COL_LENGTH('Clientes', 'TipoTarjeta') IS NULL
BEGIN
    ALTER TABLE Clientes
    ADD TipoTarjeta VARCHAR(20) NULL;
END
GO

/* Ampliar el número para permitir formato con espacios */
ALTER TABLE Clientes
ALTER COLUMN NoTarjetaCR VARCHAR(19) NULL;
GO

SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Clientes'
ORDER BY ORDINAL_POSITION;
GO


SELECT TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;









USE RentCarDB;
GO

SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

BEGIN TRY
    /* =====================================================
       1. BORRAR DATOS TRANSACCIONALES
       ===================================================== */

    DELETE FROM Inspecciones;
    DELETE FROM Rentas;

    /* =====================================================
       2. BORRAR DATOS PRINCIPALES
       ===================================================== */

    DELETE FROM Clientes;
    DELETE FROM Vehiculos;
    DELETE FROM Empleados;

    /* =====================================================
       3. REINICIAR IDENTIDADES
       ===================================================== */

    DBCC CHECKIDENT ('Inspecciones', RESEED, 0);
    DBCC CHECKIDENT ('Rentas', RESEED, 0);
    DBCC CHECKIDENT ('Clientes', RESEED, 0);
    DBCC CHECKIDENT ('Vehiculos', RESEED, 0);
    DBCC CHECKIDENT ('Empleados', RESEED, 0);

    /* =====================================================
       4. CREAR ADMINISTRADOR CON ID = 1
       ===================================================== */

    INSERT INTO Empleados
    (
        Nombre,
        Cedula,
        Usuario,
        TandaLabor,
        PorcientoComision,
        FechaIngreso,
        Estado
    )
    VALUES
    (
        'Administrador General',
        '40212428508',
        'admin',
        'Matutina',
        0,
        GETDATE(),
        1
    );

    COMMIT TRANSACTION;

    PRINT 'Datos eliminados correctamente.';
    PRINT 'Administrador General creado nuevamente con Id = 1.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT 'No fue posible limpiar la base de datos.';
    PRINT ERROR_MESSAGE();

    THROW;
END CATCH;
GO




USE RentCarDB;
GO

IF COL_LENGTH('Clientes', 'NoTarjetaCR') IS NULL
BEGIN
    ALTER TABLE Clientes
    ADD NoTarjetaCR VARCHAR(19) NULL;
END
GO

IF COL_LENGTH('Clientes', 'NombreTitularTarjeta') IS NULL
BEGIN
    ALTER TABLE Clientes
    ADD NombreTitularTarjeta VARCHAR(120) NULL;
END
GO

IF COL_LENGTH('Clientes', 'FechaExpiracionTarjeta') IS NULL
BEGIN
    ALTER TABLE Clientes
    ADD FechaExpiracionTarjeta VARCHAR(5) NULL;
END
GO

IF COL_LENGTH('Clientes', 'TipoTarjeta') IS NULL
BEGIN
    ALTER TABLE Clientes
    ADD TipoTarjeta VARCHAR(20) NULL;
END
GO

IF COL_LENGTH('Clientes', 'TipoPersona') IS NULL
BEGIN
    ALTER TABLE Clientes
    ADD TipoPersona VARCHAR(20) NULL;
END
GO

ALTER TABLE Clientes
ALTER COLUMN NoTarjetaCR VARCHAR(19) NULL;
GO

SELECT
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'Clientes'
ORDER BY ORDINAL_POSITION;
GO

SELECT
    Id,
    Nombre,
    Cedula,
    Usuario,
    TandaLabor,
    PorcientoComision,
    FechaIngreso,
    Estado
FROM Empleados;



SELECT COUNT(*) AS TotalClientes FROM Clientes;
SELECT COUNT(*) AS TotalVehiculos FROM Vehiculos;
SELECT COUNT(*) AS TotalRentas FROM Rentas;
SELECT COUNT(*) AS TotalInspecciones FROM Inspecciones;

USE RentCarDB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRANSACTION;

BEGIN TRY

    /*==============================
      ELIMINAR DATOS
    ==============================*/

    DELETE FROM Inspecciones;
    DELETE FROM Rentas;
    DELETE FROM Clientes;
    DELETE FROM Vehiculos;
    DELETE FROM Empleados;
    DELETE FROM Modelos;
    DELETE FROM Marcas;
    DELETE FROM TiposVehiculos;
    DELETE FROM TiposCombustibles;

    /*==============================
      REINICIAR IDENTIDADES
    ==============================*/

    DBCC CHECKIDENT ('Inspecciones', RESEED, 0);
    DBCC CHECKIDENT ('Rentas', RESEED, 0);
    DBCC CHECKIDENT ('Clientes', RESEED, 0);
    DBCC CHECKIDENT ('Vehiculos', RESEED, 0);
    DBCC CHECKIDENT ('Empleados', RESEED, 0);
    DBCC CHECKIDENT ('Modelos', RESEED, 0);
    DBCC CHECKIDENT ('Marcas', RESEED, 0);
    DBCC CHECKIDENT ('TiposVehiculos', RESEED, 0);
    DBCC CHECKIDENT ('TiposCombustibles', RESEED, 0);

    COMMIT TRANSACTION;

    PRINT 'Base de datos reiniciada correctamente.';
    PRINT 'Todos los ID comenzarán nuevamente desde 1.';

END TRY
BEGIN CATCH

    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    PRINT ERROR_MESSAGE();

END CATCH;
GO












USE RentCarDB;
GO

/* Estado operativo del vehículo */
IF COL_LENGTH('Vehiculos', 'EstadoOperacion') IS NULL
BEGIN
    ALTER TABLE Vehiculos
    ADD EstadoOperacion VARCHAR(20) NOT NULL
        CONSTRAINT DF_Vehiculos_EstadoOperacion
        DEFAULT 'Disponible';
END
GO

/* Actualizar registros anteriores */
UPDATE Vehiculos
SET EstadoOperacion =
    CASE
        WHEN Estado = 1 THEN 'Disponible'
        ELSE 'Rentado'
    END
WHERE EstadoOperacion IS NULL
   OR LTRIM(RTRIM(EstadoOperacion)) = '';
GO

/* Ajustar placa */
ALTER TABLE Vehiculos
ALTER COLUMN NoPlaca VARCHAR(7) NOT NULL;
GO

/* Ajustar chasis */
ALTER TABLE Vehiculos
ALTER COLUMN NoChasis VARCHAR(17) NULL;
GO

/* Ajustar estado */
ALTER TABLE Vehiculos
ALTER COLUMN EstadoOperacion VARCHAR(20) NOT NULL;
GO

/* Índice único para placa */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_Vehiculos_NoPlaca'
      AND object_id = OBJECT_ID('Vehiculos')
)
BEGIN
    CREATE UNIQUE INDEX UX_Vehiculos_NoPlaca
    ON Vehiculos(NoPlaca);
END
GO

/* Índice único para chasis */
IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = 'UX_Vehiculos_NoChasis'
      AND object_id = OBJECT_ID('Vehiculos')
)
BEGIN
    CREATE UNIQUE INDEX UX_Vehiculos_NoChasis
    ON Vehiculos(NoChasis)
    WHERE NoChasis IS NOT NULL;
END
GO

SELECT
    Id,
    Descripcion,
    NoPlaca,
    NoChasis,
    Estado,
    EstadoOperacion
FROM Vehiculos
ORDER BY Id;
GO