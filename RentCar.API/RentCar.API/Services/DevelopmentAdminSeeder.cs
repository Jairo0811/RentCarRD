using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;
using RentCar.API.Security;

namespace RentCar.API.Services;

public sealed class DevelopmentAdminSeeder(
    RentCarDbContext db,
    IPasswordHasher<Empleado> passwordHasher,
    IConfiguration configuration,
    ILogger<DevelopmentAdminSeeder> logger)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        if (!configuration.GetValue<bool>("SeedAdmin:Enabled"))
        {
            return;
        }

        var usuario = configuration["SeedAdmin:Usuario"]?.Trim();
        var password = configuration["SeedAdmin:Password"];
        var nombre = configuration["SeedAdmin:Nombre"]?.Trim();
        var cedula = new string(
            (configuration["SeedAdmin:Cedula"] ?? string.Empty)
                .Where(char.IsDigit)
                .ToArray());

        if (string.IsNullOrWhiteSpace(usuario) ||
            string.IsNullOrWhiteSpace(password) ||
            password.Length < 12 ||
            string.IsNullOrWhiteSpace(nombre) ||
            cedula.Length != 11)
        {
            throw new InvalidOperationException(
                "SeedAdmin requiere Usuario, Nombre, Cédula de 11 dígitos y Password de 12+ caracteres en User Secrets.");
        }

        var normalizedUser = usuario.ToLowerInvariant();
        var existing = await db.Empleados
            .FirstOrDefaultAsync(
                employee => employee.Usuario == normalizedUser,
                cancellationToken);

        if (existing is not null)
        {
            logger.LogInformation(
                "El administrador de desarrollo {Usuario} ya existe; no se cambió su contraseña.",
                normalizedUser);
            return;
        }

        var employee = new Empleado
        {
            Nombre = nombre,
            Cedula = cedula,
            Usuario = normalizedUser,
            Rol = AppRoles.Administrador,
            TandaLabor = "Administrativa",
            PorcientoComision = 0,
            FechaIngreso = DateTime.UtcNow,
            Estado = true
        };
        employee.PasswordHash = passwordHasher.HashPassword(employee, password);

        db.Empleados.Add(employee);
        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Se creó el administrador de desarrollo {Usuario}. La contraseña no se registró en logs.",
            normalizedUser);
    }
}
