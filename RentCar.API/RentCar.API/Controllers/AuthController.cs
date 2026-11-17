using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Auth;
using RentCar.API.Domain;
using RentCar.API.Dtos;
using RentCar.API.Models;

namespace RentCar.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(RentCarDbContext context, IPasswordHasher<Empleado> hasher, TokenService tokens) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var usuario = request.Usuario.Trim().ToLowerInvariant();
        var empleado = await context.Empleados.SingleOrDefaultAsync(
            e => e.Usuario.ToLower() == usuario && e.Estado, cancellationToken);

        var resultado = empleado is null || string.IsNullOrWhiteSpace(empleado.PasswordHash)
            ? PasswordVerificationResult.Failed
            : hasher.VerifyHashedPassword(empleado, empleado.PasswordHash, request.Password);

        if (resultado == PasswordVerificationResult.Failed)
        {
            await Task.Delay(Random.Shared.Next(150, 350), cancellationToken);
            return Unauthorized(new { mensaje = "Credenciales incorrectas." });
        }

        if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
        {
            empleado!.PasswordHash = hasher.HashPassword(empleado, request.Password);
            await context.SaveChangesAsync(cancellationToken);
        }

        return Ok(tokens.Create(empleado!.Usuario, empleado.Nombre, Roles.ParaUsuario(empleado.Usuario), empleado.Id));
    }

    /// <summary>
    /// Perfil mínimo del usuario autenticado (Admin o Empleado). Sustituye la necesidad de
    /// consultar el listado administrativo de empleados para conocer el nombre propio.
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<PerfilActualResponse>> Me(CancellationToken cancellationToken)
    {
        var empleadoId = User.EmpleadoId();
        if (empleadoId is null)
        {
            return Unauthorized();
        }

        var perfil = await context.Empleados
            .AsNoTracking()
            .Where(e => e.Id == empleadoId && e.Estado)
            .Select(e => new { e.Id, e.Nombre, e.Usuario })
            .SingleOrDefaultAsync(cancellationToken);

        return perfil is null
            ? Unauthorized()
            : Ok(new PerfilActualResponse(perfil.Id, perfil.Nombre, perfil.Usuario, Roles.ParaUsuario(perfil.Usuario)));
    }
}
