using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.FileProviders;
using RentCar.API.Infrastructure;
using RentCar.API.Models;

namespace RentCar.API.Tests.Integration;

/// <summary>
/// API real (pipeline completo: autenticación, autorización, rate limiting, migraciones)
/// contra una base SQL Server aislada y desechable. No usa EF InMemory: la concurrencia,
/// los índices filtrados y las claves foráneas solo se comportan fielmente en SQL Server.
///
/// Conexión: variable RENTCARRD_TEST_SQL (servidor, sin base). En CI la provee el servicio
/// de contenedor mssql de GitHub Actions; en Windows se usa LocalDB por defecto.
/// </summary>
public sealed class RentCarApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    public const string AdminPassword = "AdminPrueba2026!";
    public const string AdminCedula = "40212428508";

    private readonly string _baseDatos = "RentCarTest_" + Guid.NewGuid().ToString("N")[..12];

    public static string Servidor =>
        Environment.GetEnvironmentVariable("RENTCARRD_TEST_SQL") is { Length: > 0 } valor
            ? valor
            : "Server=(localdb)\\MSSQLLocalDB;Trusted_Connection=True;TrustServerCertificate=True;";

    public string ConnectionString => new SqlConnectionStringBuilder(Servidor) { InitialCatalog = _baseDatos }.ConnectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:DefaultConnection", ConnectionString);
        builder.UseSetting("Jwt:Key", "clave-de-pruebas-automatizadas-rentcarrd-0123456789");
        builder.UseSetting("Jwt:Issuer", "RentCarRD.Api");
        builder.UseSetting("Jwt:Audience", "RentCarRD.Angular");
        builder.UseSetting("Cors:AllowedOrigins:0", "https://localhost:4200");
        builder.UseSetting("AllowedHosts", "localhost");
        builder.UseSetting("Database:MigrateOnStartup", "true");
        builder.UseSetting("RateLimiting:GlobalPermitLimit", "100000");
        builder.UseSetting("RateLimiting:AuthPermitLimit", "100000");
        builder.UseSetting("RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD", AdminPassword);
        builder.UseSetting("RENTCARRD_BOOTSTRAP_ADMIN_CEDULA", AdminCedula);

        // Las imágenes subidas en las pruebas se escriben en una carpeta temporal,
        // nunca en el wwwroot del código fuente.
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<AlmacenImagenesVehiculos>();
            services.AddSingleton(new AlmacenImagenesVehiculos(new EntornoWebPrueba(CarpetaImagenes)));
        });
    }

    public string CarpetaImagenes { get; } = Path.Combine(Path.GetTempPath(), "rentcarrd-wwwroot-" + Guid.NewGuid().ToString("N"));

    Task IAsyncLifetime.InitializeAsync()
    {
        // Fuerza el arranque (migraciones + administrador inicial) antes de las pruebas.
        _ = Server;
        return Task.CompletedTask;
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await base.DisposeAsync();
        if (Directory.Exists(CarpetaImagenes))
        {
            Directory.Delete(CarpetaImagenes, recursive: true);
        }

        SqlConnection.ClearAllPools();
        await using var conexion = new SqlConnection(Servidor);
        await conexion.OpenAsync();
        await using var comando = conexion.CreateCommand();
        comando.CommandText = $"""
            IF DB_ID(N'{_baseDatos}') IS NOT NULL
            BEGIN
                ALTER DATABASE [{_baseDatos}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                DROP DATABASE [{_baseDatos}];
            END
            """;
        await comando.ExecuteNonQueryAsync();
    }

    public RentCarDbContext CrearDbContext()
    {
        var scope = Services.CreateScope();
        return scope.ServiceProvider.GetRequiredService<RentCarDbContext>();
    }

    public async Task<HttpClient> ClienteAutenticadoAsync(string usuario, string password)
    {
        var cliente = CreateClient();
        var respuesta = await cliente.PostAsJsonAsync("/api/auth/login", new { usuario, password });
        respuesta.EnsureSuccessStatusCode();
        var login = await respuesta.Content.ReadFromJsonAsync<LoginDto>();
        cliente.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", login!.AccessToken);
        return cliente;
    }

    public Task<HttpClient> AdminAsync() => ClienteAutenticadoAsync("admin", AdminPassword);

    public sealed record LoginDto(string AccessToken, DateTime ExpiresAtUtc, string Rol, int? EmpleadoId, string Nombre);
}

public sealed class EntornoWebPrueba(string raiz) : IWebHostEnvironment
{
    public string WebRootPath { get; set; } = Path.Combine(raiz, "wwwroot");
    public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
    public string ApplicationName { get; set; } = "RentCar.API.Tests";
    public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
    public string ContentRootPath { get; set; } = raiz;
    public string EnvironmentName { get; set; } = "Testing";
}

[CollectionDefinition(Nombre)]
public sealed class ColeccionApi : ICollectionFixture<RentCarApiFactory>
{
    public const string Nombre = "API RentCarRD contra SQL Server";
}
