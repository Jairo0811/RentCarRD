using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Auth;
using RentCar.API.Domain;
using RentCar.API.Dtos;
using RentCar.API.Models;

namespace RentCar.API.Controllers;

/// <summary>
/// Administración de empleados: exclusiva del rol Admin.
/// Los empleados obtienen su propio perfil mediante GET /api/auth/me, sin acceder al listado.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = Roles.Admin)]
public partial class EmpleadosController(RentCarDbContext context, IPasswordHasher<Empleado> passwordHasher) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<EmpleadoResponse>>> GetEmpleados(CancellationToken cancellationToken)
    {
        var empleados = await context.Empleados.AsNoTracking().OrderBy(e => e.Nombre).ToListAsync(cancellationToken);
        return Ok(empleados.Select(AResponse));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmpleadoResponse>> GetEmpleado(int id, CancellationToken cancellationToken)
    {
        var empleado = await context.Empleados.AsNoTracking().FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        return empleado is null ? NotFound("El empleado solicitado no existe.") : Ok(AResponse(empleado));
    }

    [HttpGet("validar-cedula/{cedula}")]
    public async Task<IActionResult> ValidarCedula(string cedula, int? idEmpleado = null, CancellationToken cancellationToken = default)
    {
        var limpia = DocumentosDominicanos.SoloDigitos(cedula);
        var esValida = DocumentosDominicanos.CedulaValida(limpia);
        var existente = await context.Empleados
            .AsNoTracking()
            .Where(e => e.Cedula == limpia && (!idEmpleado.HasValue || e.Id != idEmpleado.Value))
            .Select(e => new { e.Nombre })
            .FirstOrDefaultAsync(cancellationToken);

        return Ok(new
        {
            cedula = limpia,
            cedulaFormateada = DocumentosDominicanos.FormatearCedula(limpia),
            esValida = esValida && existente is null,
            existe = existente is not null,
            nombreEmpleado = existente?.Nombre,
            fuente = "Validador local",
            mensaje = !esValida
                ? "La cédula ingresada no es válida."
                : existente is not null
                    ? $"Esta cédula ya pertenece al empleado {existente.Nombre}."
                    : "Cédula válida y disponible para registrar."
        });
    }

    [HttpPost]
    public async Task<ActionResult<EmpleadoResponse>> PostEmpleado(CrearEmpleadoRequest request, CancellationToken cancellationToken)
    {
        var error = Normalizar(request) ?? ValidarPassword(request.Password);
        if (error is not null)
        {
            return BadRequest(error);
        }

        if (request.Usuario == Roles.UsuarioAdministrador)
        {
            return Conflict("El usuario 'admin' está reservado para la cuenta administradora.");
        }

        var conflicto = await BuscarDuplicados(request, idActual: null, cancellationToken);
        if (conflicto is not null)
        {
            return Conflict(conflicto);
        }

        var empleado = new Empleado();
        Aplicar(empleado, request);
        empleado.FechaIngreso = (request.FechaIngreso ?? DateTime.Today).Date;
        empleado.PasswordHash = passwordHasher.HashPassword(empleado, request.Password);

        context.Empleados.Add(empleado);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetEmpleado), new { id = empleado.Id }, AResponse(empleado));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> PutEmpleado(int id, ActualizarEmpleadoRequest request, CancellationToken cancellationToken)
    {
        var empleado = await context.Empleados.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        if (empleado is null)
        {
            return NotFound("El empleado solicitado no existe.");
        }

        var error = Normalizar(request);
        if (error is null && !string.IsNullOrEmpty(request.Password))
        {
            error = ValidarPassword(request.Password);
        }

        if (error is not null)
        {
            return BadRequest(error);
        }

        var esCuentaAdmin = empleado.Usuario == Roles.UsuarioAdministrador;
        if (esCuentaAdmin && request.Usuario != Roles.UsuarioAdministrador)
        {
            return Conflict("La cuenta 'admin' no puede renombrarse: perdería el rol administrador.");
        }

        if (!esCuentaAdmin && request.Usuario == Roles.UsuarioAdministrador)
        {
            return Conflict("El usuario 'admin' está reservado para la cuenta administradora.");
        }

        if (!request.Estado && (esCuentaAdmin || empleado.Id == User.EmpleadoId()))
        {
            return Conflict("No puede inactivar la cuenta administradora ni su propia cuenta.");
        }

        var conflicto = await BuscarDuplicados(request, id, cancellationToken);
        if (conflicto is not null)
        {
            return Conflict(conflicto);
        }

        // Actualización explícita campo a campo: no se adjunta la entidad recibida,
        // de modo que Id, PasswordHash u otros campos no pueden sobrescribirse por accidente.
        Aplicar(empleado, request);
        if (request.FechaIngreso.HasValue)
        {
            empleado.FechaIngreso = request.FechaIngreso.Value.Date;
        }

        if (!string.IsNullOrEmpty(request.Password))
        {
            empleado.PasswordHash = passwordHasher.HashPassword(empleado, request.Password);
        }

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteEmpleado(int id, CancellationToken cancellationToken)
    {
        var empleado = await context.Empleados.FindAsync([id], cancellationToken);
        if (empleado is null)
        {
            return NotFound("El empleado solicitado no existe.");
        }

        if (empleado.Usuario == Roles.UsuarioAdministrador || empleado.Id == User.EmpleadoId())
        {
            return Conflict("No puede eliminar la cuenta administradora ni su propia cuenta.");
        }

        if (await context.Rentas.AnyAsync(r => r.IdEmpleado == id, cancellationToken) ||
            await context.Inspecciones.AnyAsync(i => i.IdEmpleadoInspeccion == id, cancellationToken))
        {
            return Conflict("El empleado tiene rentas o inspecciones registradas; inactívelo en lugar de eliminarlo para conservar el historial.");
        }

        context.Empleados.Remove(empleado);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static string? Normalizar(EmpleadoBaseRequest request)
    {
        request.Nombre = (request.Nombre ?? string.Empty).Trim();
        request.Cedula = DocumentosDominicanos.SoloDigitos(request.Cedula);
        request.Usuario = (request.Usuario ?? string.Empty).Trim().ToLowerInvariant();
        request.TandaLabor = TandasLaborales.Todas
            .FirstOrDefault(t => string.Equals(t, request.TandaLabor?.Trim(), StringComparison.OrdinalIgnoreCase))
            ?? string.Empty;

        if (string.IsNullOrWhiteSpace(request.Nombre))
            return "El nombre del empleado es obligatorio.";
        if (!DocumentosDominicanos.CedulaValida(request.Cedula))
            return "La cédula ingresada no es válida.";
        if (!UsuarioValido().IsMatch(request.Usuario))
            return "El usuario debe tener entre 3 y 80 caracteres: letras minúsculas, números, punto, guion o guion bajo.";
        if (string.IsNullOrEmpty(request.TandaLabor))
            return "La tanda laboral debe ser Matutina, Vespertina o Nocturna.";
        if (request.PorcientoComision is < 0 or > 100)
            return "El porcentaje de comisión debe estar entre 0 y 100.";
        return null;
    }

    /// <summary>Política mínima: 8–128 caracteres, al menos una letra y un número.</summary>
    internal static string? ValidarPassword(string? password)
    {
        if (string.IsNullOrEmpty(password) || password.Length < 8 || password.Length > 128)
            return "La contraseña debe tener entre 8 y 128 caracteres.";
        if (!password.Any(char.IsLetter) || !password.Any(char.IsDigit))
            return "La contraseña debe contener al menos una letra y un número.";
        return null;
    }

    private async Task<string?> BuscarDuplicados(EmpleadoBaseRequest request, int? idActual, CancellationToken cancellationToken)
    {
        if (await context.Empleados.AnyAsync(e => e.Cedula == request.Cedula && e.Id != idActual, cancellationToken))
            return "Ya existe otro empleado registrado con esta cédula.";
        if (await context.Empleados.AnyAsync(e => e.Usuario == request.Usuario && e.Id != idActual, cancellationToken))
            return "Ya existe otro empleado registrado con este usuario.";
        return null;
    }

    private static void Aplicar(Empleado empleado, EmpleadoBaseRequest request)
    {
        empleado.Nombre = request.Nombre;
        empleado.Cedula = request.Cedula;
        empleado.Usuario = request.Usuario;
        empleado.TandaLabor = request.TandaLabor;
        empleado.PorcientoComision = request.PorcientoComision;
        empleado.Estado = request.Estado;
    }

    private static EmpleadoResponse AResponse(Empleado e) => new(
        e.Id, e.Nombre, e.Cedula, e.TandaLabor, e.PorcientoComision, e.FechaIngreso, e.Estado, e.Usuario,
        Roles.ParaUsuario(e.Usuario));

    [GeneratedRegex("^[a-z0-9._-]{3,80}$")]
    private static partial Regex UsuarioValido();
}
