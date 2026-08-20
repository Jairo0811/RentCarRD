using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Auth;
using RentCar.API.Models;

namespace RentCar.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(RentCarDbContext context, IPasswordHasher<Empleado> hasher, TokenService tokens) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var usuario = request.Usuario.Trim().ToLowerInvariant();
        var empleado = await context.Empleados.SingleOrDefaultAsync(
            e => e.Usuario.ToLower() == usuario && e.Estado, cancellationToken);

        if (empleado is null || string.IsNullOrWhiteSpace(empleado.PasswordHash) ||
            hasher.VerifyHashedPassword(empleado, empleado.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
        {
            await Task.Delay(Random.Shared.Next(150, 350), cancellationToken);
            return Unauthorized(new { mensaje = "Credenciales incorrectas." });
        }

        var rol = empleado.Usuario.Equals("admin", StringComparison.OrdinalIgnoreCase) ? "Admin" : "Empleado";
        return Ok(tokens.Create(empleado.Usuario, empleado.Nombre, rol, empleado.Id));
    }
}
