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