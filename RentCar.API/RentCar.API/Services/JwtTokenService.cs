using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using RentCar.API.Contracts;
using RentCar.API.Models;
using RentCar.API.Security;

namespace RentCar.API.Services;

public sealed class JwtTokenService(IConfiguration configuration)
{
    public AuthResponse Create(Empleado empleado)
    {
        var key = configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("Jwt:Key no está configurado.");
        var issuer = configuration["Jwt:Issuer"]
            ?? throw new InvalidOperationException("Jwt:Issuer no está configurado.");
        var audience = configuration["Jwt:Audience"]
            ?? throw new InvalidOperationException("Jwt:Audience no está configurado.");
        var minutes = Math.Clamp(
            configuration.GetValue("Jwt:ExpirationMinutes", 60),
            5,
            480);
        var expires = DateTimeOffset.UtcNow.AddMinutes(minutes);
        var role = AppRoles.Normalize(empleado.Rol);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, empleado.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, empleado.Id.ToString()),
            new Claim(ClaimTypes.Name, empleado.Usuario),
            new Claim("display_name", empleado.Nombre),
            new Claim(ClaimTypes.Role, role)
        };

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: expires.UtcDateTime,
            signingCredentials: credentials);

        return new AuthResponse(
            new JwtSecurityTokenHandler().WriteToken(token),
            expires,
            empleado.Id,
            empleado.Nombre,
            empleado.Usuario,
            role);
    }
}
