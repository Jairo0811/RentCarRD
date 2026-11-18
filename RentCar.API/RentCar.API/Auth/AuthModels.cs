using System.ComponentModel.DataAnnotations;

namespace RentCar.API.Auth;

/// <summary>
/// Credenciales de inicio de sesión.
/// v1.2.1: los atributos de validación van en los parámetros del constructor. En v1.2 estaban
/// declarados con "property:", y ASP.NET Core MVC rechaza esa forma en records posicionales
/// lanzando InvalidOperationException en cada solicitud (POST /api/auth/login respondía 500).
/// </summary>
public sealed record LoginRequest(
    [Required, StringLength(80, MinimumLength = 3)] string Usuario,
    [Required, StringLength(128, MinimumLength = 8)] string Password);

public sealed record LoginResponse(string AccessToken, DateTime ExpiresAtUtc, string Rol, int? EmpleadoId, string Nombre);

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string Key { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 30;
}
