using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Contracts;
using RentCar.API.Models;
using RentCar.API.Security;
using RentCar.API.Services;

namespace RentCar.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    RentCarDbContext db,
    IPasswordHasher<Empleado> passwordHasher,
    JwtTokenService tokenService) : ControllerBase
{
    [AllowAnonymous]
    [EnableRateLimiting("auth")]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var usuario = request.Usuario.Trim().ToLowerInvariant();
        var employee = await db.Empleados
            .SingleOrDefaultAsync(
                item => item.Usuario == usuario && item.Estado,
                cancellationToken);

        if (employee is null || string.IsNullOrWhiteSpace(employee.PasswordHash))
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
        }

        var result = passwordHasher.VerifyHashedPassword(
            employee,
            employee.PasswordHash,
            request.Password);

        if (result == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
        }

        if (result == PasswordVerificationResult.SuccessRehashNeeded)
        {
            employee.PasswordHash = passwordHasher.HashPassword(employee, request.Password);
            await db.SaveChangesAsync(cancellationToken);
        }

        return Ok(tokenService.Create(employee));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<CurrentUserResponse>> Me(
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(
                User.FindFirstValue(ClaimTypes.NameIdentifier),
                out var employeeId))
        {
            return Unauthorized();
        }

        var employee = await db.Empleados
            .AsNoTracking()
            .FirstOrDefaultAsync(
                item => item.Id == employeeId && item.Estado,
                cancellationToken);

        if (employee is null)
        {
            return Unauthorized();
        }

        return Ok(new CurrentUserResponse(
            employee.Id,
            employee.Nombre,
            employee.Usuario,
            AppRoles.Normalize(employee.Rol)));
    }
}
