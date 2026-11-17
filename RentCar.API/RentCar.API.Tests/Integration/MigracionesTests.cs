using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Tests.Integration;

/// <summary>
/// Verifica las migraciones contra una base "histórica" creada como en v1.2 (script manual
/// RentCarDB.sql + migración AgregarCampoUsuario aplicada), con datos de prueba sensibles.
/// </summary>
public sealed class MigracionesTests : IAsyncLifetime
{
    private readonly string _baseDatos = "RentCarLegacy_" + Guid.NewGuid().ToString("N")[..12];
    private string Conexion => new SqlConnectionStringBuilder(RentCarApiFactory.Servidor) { InitialCatalog = _baseDatos }.ConnectionString;

    private const string EsquemaHistorico = """
        CREATE TABLE TiposVehiculos (Id INT PRIMARY KEY IDENTITY, Descripcion VARCHAR(100), Estado BIT DEFAULT 1);
        CREATE TABLE Marcas (Id INT PRIMARY KEY IDENTITY, Descripcion VARCHAR(100), Estado BIT DEFAULT 1);
        CREATE TABLE Modelos (Id INT PRIMARY KEY IDENTITY, IdMarca INT FOREIGN KEY REFERENCES Marcas(Id), Descripcion VARCHAR(100), Estado BIT DEFAULT 1);
        CREATE TABLE TiposCombustibles (Id INT PRIMARY KEY IDENTITY, Descripcion VARCHAR(100), Estado BIT DEFAULT 1);
        CREATE TABLE Vehiculos (
            Id INT PRIMARY KEY IDENTITY, Descripcion VARCHAR(200), NoChasis VARCHAR(50), NoMotor VARCHAR(50), NoPlaca VARCHAR(20),
            IdTipoVehiculo INT FOREIGN KEY REFERENCES TiposVehiculos(Id), IdMarca INT FOREIGN KEY REFERENCES Marcas(Id),
            IdModelo INT FOREIGN KEY REFERENCES Modelos(Id), IdTipoCombustible INT FOREIGN KEY REFERENCES TiposCombustibles(Id),
            Estado BIT DEFAULT 1);
        CREATE TABLE Clientes (Id INT PRIMARY KEY IDENTITY, Nombre VARCHAR(100), Cedula VARCHAR(11) UNIQUE, NoTarjetaCR VARCHAR(20),
            LimiteCredito DECIMAL(18,2), TipoPersona VARCHAR(20), Estado BIT DEFAULT 1);
        CREATE TABLE Empleados (Id INT PRIMARY KEY IDENTITY, Nombre VARCHAR(100), Cedula VARCHAR(11) UNIQUE, TandaLabor VARCHAR(20),
            PorcientoComision INT, FechaIngreso DATE, Estado BIT DEFAULT 1);
        CREATE TABLE Inspecciones (Id INT PRIMARY KEY IDENTITY, IdVehiculo INT FOREIGN KEY REFERENCES Vehiculos(Id),
            IdCliente INT FOREIGN KEY REFERENCES Clientes(Id), TieneRalladuras BIT, CantidadCombustible VARCHAR(20),
            TieneGomaRespuesta BIT, TieneGato BIT, TieneRoturasCristal BIT, EstadoGomas_D_D BIT, EstadoGomas_D_I BIT,
            EstadoGomas_T_D BIT, EstadoGomas_T_I BIT, Fecha DATE DEFAULT GETDATE(),
            IdEmpleadoInspeccion INT FOREIGN KEY REFERENCES Empleados(Id), Estado BIT DEFAULT 1);
        CREATE TABLE Rentas (NoRenta INT PRIMARY KEY IDENTITY, IdEmpleado INT FOREIGN KEY REFERENCES Empleados(Id),
            IdVehiculo INT FOREIGN KEY REFERENCES Vehiculos(Id), IdCliente INT FOREIGN KEY REFERENCES Clientes(Id),
            FechaRenta DATE, FechaDevolucion DATE, MontoXDia DECIMAL(18,2), CantidadDias INT, Comentario TEXT,
            Estado VARCHAR(20) DEFAULT 'Activa');

        ALTER TABLE Vehiculos ADD ImagenUrl VARCHAR(300) NULL;
        ALTER TABLE Clientes ADD NombreTitularTarjeta VARCHAR(120) NULL, FechaExpiracionTarjeta VARCHAR(5) NULL, TipoTarjeta VARCHAR(20) NULL;
        ALTER TABLE Clientes ALTER COLUMN NoTarjetaCR VARCHAR(19) NULL;
        ALTER TABLE Vehiculos ADD EstadoOperacion VARCHAR(20) NOT NULL CONSTRAINT DF_Vehiculos_EstadoOperacion DEFAULT 'Disponible';
        ALTER TABLE Rentas ADD Subtotal DECIMAL(18,2) NOT NULL CONSTRAINT DF_Rentas_Subtotal DEFAULT(0),
            Itbis DECIMAL(18,2) NOT NULL CONSTRAINT DF_Rentas_Itbis DEFAULT(0);

        -- Efecto de la migración histórica AgregarCampoUsuario (aplicada con dotnet ef en v1.2).
        ALTER TABLE Empleados ADD Usuario NVARCHAR(MAX) NOT NULL DEFAULT N'';
        CREATE TABLE __EFMigrationsHistory (MigrationId NVARCHAR(150) NOT NULL PRIMARY KEY, ProductVersion NVARCHAR(32) NOT NULL);
        INSERT INTO __EFMigrationsHistory VALUES ('20260621211617_AgregarCampoUsuario', '10.0.9');
        """;

    private const string DatosHistoricos = """
        INSERT INTO Marcas (Descripcion, Estado) VALUES ('Toyota', 1);
        INSERT INTO Modelos (IdMarca, Descripcion, Estado) VALUES (1, 'Corolla', 1);
        INSERT INTO TiposVehiculos (Descripcion, Estado) VALUES ('Sedán', 1);
        INSERT INTO TiposCombustibles (Descripcion, Estado) VALUES ('Gasolina', 1);
        INSERT INTO Vehiculos (Descripcion, NoChasis, NoMotor, NoPlaca, IdTipoVehiculo, IdMarca, IdModelo, IdTipoCombustible, Estado, EstadoOperacion)
            VALUES ('Corolla 2020', 'CH001', 'MT001', 'A123456', 1, 1, 1, 1, 0, 'Rentado'),
                   ('Corolla 2021', 'CH002', 'MT002', 'A654321', 1, 1, 1, 1, 1, 'Disponible');
        INSERT INTO Clientes (Nombre, Cedula, NoTarjetaCR, LimiteCredito, TipoPersona, Estado, NombreTitularTarjeta, FechaExpiracionTarjeta, TipoTarjeta)
            VALUES ('Cliente Histórico', '00100000017', '4111 1111 1111 1111', 5000, 'Fisica', 1, 'TITULAR REAL', '12/29', 'VISA'),
                   ('Cliente Sin Tarjeta', '00123456782', NULL, 0, 'Fisica', 1, NULL, NULL, NULL);
        INSERT INTO Empleados (Nombre, Cedula, TandaLabor, PorcientoComision, FechaIngreso, Estado, Usuario)
            VALUES ('Administrador General', '40212428508', 'Matutina', 0, '2026-05-01', 1, 'admin');
        INSERT INTO Inspecciones (IdVehiculo, IdCliente, TieneRalladuras, CantidadCombustible, TieneGomaRespuesta, TieneGato,
            TieneRoturasCristal, EstadoGomas_D_D, EstadoGomas_D_I, EstadoGomas_T_D, EstadoGomas_T_I, Fecha, IdEmpleadoInspeccion, Estado)
            VALUES (1, 1, 0, 'Lleno', 1, 1, 0, 1, 0, 1, 1, '2026-06-01', 1, 1);
        INSERT INTO Rentas (IdEmpleado, IdVehiculo, IdCliente, FechaRenta, FechaDevolucion, MontoXDia, CantidadDias, Comentario, Estado)
            VALUES (1, 1, 1, '2026-06-02', NULL, 100.25, 2, NULL, 'Abierta');
        """;

    public async Task InitializeAsync()
    {
        await EjecutarAsync(RentCarApiFactory.Servidor, $"CREATE DATABASE [{_baseDatos}];");
        await EjecutarAsync(Conexion, EsquemaHistorico);
        await EjecutarAsync(Conexion, DatosHistoricos);
    }

    public async Task DisposeAsync()
    {
        SqlConnection.ClearAllPools();
        await EjecutarAsync(RentCarApiFactory.Servidor, $"""
            IF DB_ID(N'{_baseDatos}') IS NOT NULL
            BEGIN
                ALTER DATABASE [{_baseDatos}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                DROP DATABASE [{_baseDatos}];
            END
            """);
    }

    private RentCarDbContext Contexto() =>
        new(new DbContextOptionsBuilder<RentCarDbContext>().UseSqlServer(Conexion).Options);

    [Fact]
    public async Task Base_historica_converge_al_modelo_sin_perder_registros_y_enmascara_tarjetas()
    {
        var antes = await ConteosAsync();

        await using (var db = Contexto())
        {
            await db.Database.MigrateAsync();
            Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        }

        // Sin pérdida de registros.
        Assert.Equal(antes, await ConteosAsync());

        // Privacidad: solo últimos 4 dígitos; titular y expiración vaciados; columna limitada a 4.
        Assert.Equal("1111", await EscalarAsync<string>("SELECT NoTarjetaCR FROM Clientes WHERE Cedula = '00100000017'"));
        Assert.Equal(0, await EscalarAsync<int>("SELECT COUNT(*) FROM Clientes WHERE NombreTitularTarjeta IS NOT NULL OR FechaExpiracionTarjeta IS NOT NULL"));
        Assert.Equal(4, await EscalarAsync<short>("SELECT CAST(COL_LENGTH('dbo.Clientes', 'NoTarjetaCR') AS smallint)"));

        // Normalización: estado legado, comentario y desglose monetario.
        Assert.Equal("Activa", await EscalarAsync<string>("SELECT Estado FROM Rentas WHERE NoRenta = 1"));
        Assert.Equal(200.50m, await EscalarAsync<decimal>("SELECT Subtotal FROM Rentas WHERE NoRenta = 1"));
        Assert.Equal(36.09m, await EscalarAsync<decimal>("SELECT Itbis FROM Rentas WHERE NoRenta = 1"));
        Assert.Equal(236.59m, await EscalarAsync<decimal>("SELECT Total FROM Rentas WHERE NoRenta = 1"));

        // Integridad: restricciones e índices creados.
        foreach (var objeto in new[] { "CK_Rentas_Estado", "CK_Vehiculos_EstadoOperacion" })
        {
            Assert.Equal(1, await EscalarAsync<int>($"SELECT COUNT(*) FROM sys.check_constraints WHERE name = '{objeto}'"));
        }

        Assert.Equal(1, await EscalarAsync<int>("SELECT COUNT(*) FROM sys.indexes WHERE name = 'UX_Rentas_IdVehiculo_Activa' AND has_filter = 1 AND is_unique = 1"));
        Assert.Equal(1, await EscalarAsync<int>("SELECT COUNT(*) FROM sys.indexes WHERE name = 'IX_Empleados_Usuario' AND is_unique = 1"));
        Assert.Equal("varchar", await EscalarAsync<string>("SELECT TYPE_NAME(system_type_id) FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Empleados') AND name = 'Usuario'"));

        // El modelo de EF lee los datos convergidos, incluidas las columnas renombradas.
        await using (var db = Contexto())
        {
            var inspeccion = await db.Inspecciones.AsNoTracking().SingleAsync();
            Assert.True(inspeccion.GomaDelanteraDerecha);
            Assert.False(inspeccion.GomaDelanteraIzquierda);
            Assert.Equal(1, inspeccion.IdTransaccion);

            var renta = await db.Rentas.AsNoTracking().SingleAsync();
            Assert.Equal(string.Empty, renta.Comentario);
            Assert.Equal("1111", (await db.Clientes.AsNoTracking().SingleAsync(c => c.Cedula == "00100000017")).UltimosDigitosTarjeta);
        }

        // Idempotencia: volver a ejecutar las migraciones (o su SQL) no falla.
        await using (var db = Contexto())
        {
            await db.Database.MigrateAsync();
        }
    }

    [Fact]
    public async Task Datos_que_violan_una_restriccion_detienen_la_migracion_sin_cambios_silenciosos()
    {
        // Dos rentas activas del mismo vehículo: no se puede crear el índice de unicidad.
        await EjecutarAsync(Conexion, """
            INSERT INTO Rentas (IdEmpleado, IdVehiculo, IdCliente, FechaRenta, MontoXDia, CantidadDias, Comentario, Estado)
            VALUES (1, 1, 2, '2026-06-03', 50, 1, 'duplicada', 'Activa');
            """);

        await using var db = Contexto();
        var error = await Assert.ThrowsAnyAsync<Exception>(() => db.Database.MigrateAsync());
        Assert.Contains("más de una renta activa", error.ToString());

        // La migración V121 se revirtió completa: el número de tarjeta histórico no se tocó
        // y la migración no quedó registrada como aplicada.
        Assert.Equal("4111 1111 1111 1111", await EscalarAsync<string>("SELECT NoTarjetaCR FROM Clientes WHERE Cedula = '00100000017'"));
        Assert.Equal(0, await EscalarAsync<int>("SELECT COUNT(*) FROM __EFMigrationsHistory WHERE MigrationId LIKE '%V121%'"));
    }

    private async Task<string> ConteosAsync()
    {
        var partes = new List<string>();
        foreach (var tabla in new[] { "Marcas", "Modelos", "TiposVehiculos", "TiposCombustibles", "Vehiculos", "Clientes", "Empleados", "Inspecciones", "Rentas" })
        {
            partes.Add($"{tabla}={await EscalarAsync<int>($"SELECT COUNT(*) FROM [{tabla}]")}");
        }

        return string.Join(";", partes);
    }

    private async Task<T> EscalarAsync<T>(string sql)
    {
        await using var conexion = new SqlConnection(Conexion);
        await conexion.OpenAsync();
        await using var comando = new SqlCommand(sql, conexion);
        return (T)(await comando.ExecuteScalarAsync())!;
    }

    private static async Task EjecutarAsync(string conexion, string sql)
    {
        await using var c = new SqlConnection(conexion);
        await c.OpenAsync();
        await using var comando = new SqlCommand(sql, c);
        await comando.ExecuteNonQueryAsync();
    }
}
