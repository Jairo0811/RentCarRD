using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using RentCar.API.Models;

namespace RentCar.API.Infrastructure;

/// <summary>
/// Fábrica usada solo por las herramientas de EF Core (dotnet ef) para generar o listar
/// migraciones y scripts sin arrancar la API (que exige JWT, CORS y otros secretos).
/// Para "dotnet ef database update" defina RENTCARRD_EF_CONNECTION o use la conexión de
/// desarrollo por defecto (SQL Server LocalDB).
/// </summary>
public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<RentCarDbContext>
{
    public RentCarDbContext CreateDbContext(string[] args)
    {
        var connection = Environment.GetEnvironmentVariable("RENTCARRD_EF_CONNECTION");
        if (string.IsNullOrWhiteSpace(connection))
        {
            connection = "Server=(localdb)\\MSSQLLocalDB;Database=RentCarDB;Trusted_Connection=True;TrustServerCertificate=True;";
        }

        var options = new DbContextOptionsBuilder<RentCarDbContext>()
            .UseSqlServer(connection)
            .Options;
        return new RentCarDbContext(options);
    }
}
