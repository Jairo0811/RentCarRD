using System.ComponentModel.DataAnnotations;

namespace RentCar.API.Contracts;

public sealed class LoginRequest
{
    [Required, StringLength(100, MinimumLength = 3)]
    public string Usuario { get; set; } = string.Empty;

    [Required, StringLength(200, MinimumLength = 8)]
    public string Password { get; set; } = string.Empty;
}

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset ExpiresAtUtc,
    int IdEmpleado,
    string Nombre,
    string Usuario,
    string Rol);

public sealed record CurrentUserResponse(
    int IdEmpleado,
    string Nombre,
    string Usuario,
    string Rol);
