using System.ComponentModel.DataAnnotations;

namespace RentCar.API.Auth;

public sealed record LoginRequest(
    [property: Required, StringLength(80, MinimumLength = 3)] string Usuario,
    [property: Required, StringLength(128, MinimumLength = 8)] string Password);

public sealed record LoginResponse(string AccessToken, DateTime ExpiresAtUtc, string Rol, int? EmpleadoId, string Nombre);

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; init; } = string.Empty;
    public string Audience { get; init; } = string.Empty;
    public string Key { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 30;
}
