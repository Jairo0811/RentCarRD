using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;
using RentCar.API.Security;

namespace RentCar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.Operaciones)]
public sealed class EmpleadosController(
    RentCarDbContext context,
    IPasswordHasher<Empleado> passwordHasher) : ControllerBase
{
    [HttpGet("directory")]
    public async Task<IActionResult> GetDirectory(CancellationToken cancellationToken) =>
        Ok(await context.Empleados
            .AsNoTracking()
            .Where(employee => employee.Estado)
            .OrderBy(employee => employee.Nombre)
            .Select(employee => new { employee.Id, employee.Nombre })
            .ToListAsync(cancellationToken));

    [HttpGet]
    [Authorize(Roles = AppRoles.Administrador)]
    public async Task<ActionResult<IEnumerable<Empleado>>> GetEmpleados(
        CancellationToken cancellationToken) =>
        Ok(await context.Empleados
            .AsNoTracking()
            .OrderBy(employee => employee.Nombre)
            .ToListAsync(cancellationToken));

    [HttpGet("{id:int}")]
    [Authorize(Roles = AppRoles.Administrador)]
    public async Task<ActionResult<Empleado>> GetEmpleado(
        int id,
        CancellationToken cancellationToken)
    {
        var employee = await context.Empleados
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        return employee is null ? NotFound() : Ok(employee);
    }

    [HttpGet("validar-cedula/{cedula}")]
    [Authorize(Roles = AppRoles.Administrador)]
    public async Task<IActionResult> ValidarCedula(
        string cedula,
        int? idEmpleado = null,
        CancellationToken cancellationToken = default)
    {
        var cleanId = LimpiarCedula(cedula);
        var isValid = CedulaValida(cleanId);
        var exists = await context.Empleados
            .AsNoTracking()
            .AnyAsync(item =>
                item.Cedula == cleanId &&
                (!idEmpleado.HasValue || item.Id != idEmpleado.Value),
                cancellationToken);

        return Ok(new
        {
            cedula = cleanId,
            cedulaFormateada = FormatearCedula(cleanId),
            esValida = isValid && !exists,
            existe = exists,
            fuente = "Validador local",
            mensaje = !isValid
                ? "La cédula ingresada no es válida."
                : exists
                    ? "Esta cédula ya está registrada."
                    : "Cédula válida y disponible para registrar."
        });
    }

    [HttpPost]
    [Authorize(Roles = AppRoles.Administrador)]
    public async Task<ActionResult<Empleado>> PostEmpleado(
        Empleado employee,
        CancellationToken cancellationToken)
    {
        Normalize(employee);
        var error = Validate(employee, requirePassword: true);
        if (error is not null)
        {
            return BadRequest(error);
        }

        if (await context.Empleados.AnyAsync(
                item => item.Cedula == employee.Cedula || item.Usuario == employee.Usuario,
                cancellationToken))
        {
            return Conflict("La cédula o el usuario ya están registrados.");
        }

        employee.PasswordHash = passwordHasher.HashPassword(employee, employee.Password!);
        employee.Password = null;
        context.Empleados.Add(employee);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetEmpleado), new { id = employee.Id }, employee);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = AppRoles.Administrador)]
    public async Task<IActionResult> PutEmpleado(
        int id,
        Empleado employee,
        CancellationToken cancellationToken)
    {
        if (id != employee.Id)
        {
            return BadRequest("El ID del empleado no coincide.");
        }

        var current = await context.Empleados
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (current is null)
        {
            return NotFound();
        }

        Normalize(employee);
        var error = Validate(employee, requirePassword: false);
        if (error is not null)
        {
            return BadRequest(error);
        }

        if (await context.Empleados.AnyAsync(item =>
                item.Id != id &&
                (item.Cedula == employee.Cedula || item.Usuario == employee.Usuario),
                cancellationToken))
        {
            return Conflict("La cédula o el usuario ya pertenecen a otro empleado.");
        }

        var removesAdministratorAccess =
            AppRoles.Normalize(current.Rol) == AppRoles.Administrador &&
            (!employee.Estado || employee.Rol != AppRoles.Administrador);
        if (removesAdministratorAccess &&
            !await context.Empleados.AnyAsync(item =>
                item.Id != id &&
                item.Estado &&
                item.Rol == AppRoles.Administrador,
                cancellationToken))
        {
            return BadRequest("No se puede desactivar o degradar al último administrador activo.");
        }

        current.Nombre = employee.Nombre;
        current.Cedula = employee.Cedula;
        current.Usuario = employee.Usuario;
        current.Rol = employee.Rol;
        current.TandaLabor = employee.TandaLabor;
        current.PorcientoComision = employee.PorcientoComision;
        current.FechaIngreso = employee.FechaIngreso;
        current.Estado = employee.Estado;

        if (!string.IsNullOrWhiteSpace(employee.Password))
        {
            if (employee.Password.Length < 12)
            {
                return BadRequest("La nueva contraseña debe tener al menos 12 caracteres.");
            }

            current.PasswordHash = passwordHasher.HashPassword(current, employee.Password);
        }

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:int}/password")]
    [Authorize(Roles = AppRoles.Administrador)]
    public async Task<IActionResult> ChangePassword(
        int id,
        ChangeEmployeePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var employee = await context.Empleados
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (employee is null)
        {
            return NotFound();
        }

        employee.PasswordHash = passwordHasher.HashPassword(employee, request.Password);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRoles.Administrador)]
    public async Task<IActionResult> DeleteEmpleado(
        int id,
        CancellationToken cancellationToken)
    {
        var employee = await context.Empleados
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (employee is null)
        {
            return NotFound();
        }

        if (employee.Estado &&
            AppRoles.Normalize(employee.Rol) == AppRoles.Administrador &&
            !await context.Empleados.AnyAsync(item =>
                item.Id != id &&
                item.Estado &&
                item.Rol == AppRoles.Administrador,
                cancellationToken))
        {
            return BadRequest("No se puede eliminar al último administrador activo.");
        }

        if (await context.Rentas.AnyAsync(item => item.IdEmpleado == id, cancellationToken) ||
            await context.Inspecciones.AnyAsync(
                item => item.IdEmpleadoInspeccion == id,
                cancellationToken))
        {
            employee.Estado = false;
            await context.SaveChangesAsync(cancellationToken);
            return Conflict(
                "El empleado tiene historial asociado y fue desactivado en lugar de eliminarse.");
        }

        context.Empleados.Remove(employee);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static void Normalize(Empleado employee)
    {
        employee.Nombre = (employee.Nombre ?? string.Empty).Trim();
        employee.Cedula = LimpiarCedula(employee.Cedula);
        employee.Usuario = (employee.Usuario ?? string.Empty).Trim().ToLowerInvariant();
        employee.TandaLabor = (employee.TandaLabor ?? string.Empty).Trim();
        employee.Rol = string.Equals(
            employee.Rol,
            AppRoles.Administrador,
            StringComparison.OrdinalIgnoreCase)
                ? AppRoles.Administrador
                : string.Equals(
                    employee.Rol,
                    AppRoles.Empleado,
                    StringComparison.OrdinalIgnoreCase)
                    ? AppRoles.Empleado
                    : (employee.Rol ?? string.Empty).Trim();
    }

    private static string? Validate(Empleado employee, bool requirePassword)
    {
        if (employee.Nombre.Length is < 3 or > 150)
            return "El nombre debe contener entre 3 y 150 caracteres.";
        if (!CedulaValida(employee.Cedula))
            return "La cédula ingresada no es válida.";
        if (employee.Usuario.Length is < 3 or > 100)
            return "El usuario debe contener entre 3 y 100 caracteres.";
        if (employee.Usuario.Any(character =>
                !(char.IsLetterOrDigit(character) || character is '.' or '_' or '-')))
            return "El usuario solo admite letras, números, punto, guion y guion bajo.";
        if (employee.TandaLabor.Length is < 1 or > 80)
            return "La tanda laboral es obligatoria y no puede superar 80 caracteres.";
        if (employee.PorcientoComision is < 0 or > 100)
            return "El porcentaje de comisión debe estar entre 0 y 100.";
        if (!AppRoles.IsValid(employee.Rol))
            return "El rol indicado no es válido.";
        if (requirePassword &&
            (string.IsNullOrWhiteSpace(employee.Password) || employee.Password.Length < 12))
            return "La contraseña inicial debe tener al menos 12 caracteres.";
        return null;
    }

    private static string LimpiarCedula(string? cedula) =>
        string.IsNullOrWhiteSpace(cedula)
            ? string.Empty
            : new string(cedula.Where(char.IsDigit).Take(11).ToArray());

    private static string FormatearCedula(string cedula)
    {
        cedula = LimpiarCedula(cedula);
        return cedula.Length == 11
            ? $"{cedula[..3]}-{cedula.Substring(3, 7)}-{cedula[10]}"
            : cedula;
    }

    private static bool CedulaValida(string cedula)
    {
        cedula = LimpiarCedula(cedula);
        if (cedula.Length != 11 || cedula.All(character => character == cedula[0]))
        {
            return false;
        }

        int[] weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
        var sum = 0;
        for (var index = 0; index < 10; index++)
        {
            var value = (cedula[index] - '0') * weights[index];
            sum += value >= 10 ? value / 10 + value % 10 : value;
        }

        return (10 - sum % 10) % 10 == cedula[10] - '0';
    }
}

public sealed class ChangeEmployeePasswordRequest
{
    [Required, StringLength(200, MinimumLength = 12)]
    public string Password { get; set; } = string.Empty;
}
