using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;
using RentCar.API.Security;

namespace RentCar.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = AppRoles.Operaciones)]
public sealed class ClientesController(RentCarDbContext context) : ControllerBase
{
    private const string PersonaFisica = "Fisica";
    private const string PersonaJuridica = "Juridica";

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes(
        CancellationToken cancellationToken)
    {
        return Ok(await context.Clientes
            .AsNoTracking()
            .OrderBy(cliente => cliente.Nombre)
            .ToListAsync(cancellationToken));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Cliente>> GetCliente(
        int id,
        CancellationToken cancellationToken)
    {
        var cliente = await context.Clientes
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        return cliente is null
            ? NotFound("El cliente solicitado no existe.")
            : Ok(cliente);
    }

    [HttpGet("validar-documento/{documento}")]
    public async Task<IActionResult> ValidarDocumento(
        string documento,
        string tipoPersona = PersonaFisica,
        int? idCliente = null,
        CancellationToken cancellationToken = default)
    {
        var tipoNormalizado = NormalizarTipoPersona(tipoPersona);
        var documentoLimpio = LimpiarDocumento(documento);
        var esValido = DocumentoValido(documentoLimpio, tipoNormalizado);
        var existe = await context.Clientes
            .AsNoTracking()
            .AnyAsync(item =>
                item.Cedula == documentoLimpio &&
                (!idCliente.HasValue || item.Id != idCliente.Value),
                cancellationToken);
        var nombreDocumento = ObtenerNombreDocumento(tipoNormalizado);

        return Ok(new
        {
            documento = documentoLimpio,
            documentoFormateado = FormatearDocumento(documentoLimpio, tipoNormalizado),
            tipoPersona = tipoNormalizado,
            tipoDocumento = nombreDocumento,
            esValida = esValido && !existe,
            existe,
            fuente = "Validador local",
            mensaje = !esValido
                ? $"El {nombreDocumento} ingresado no es válido."
                : existe
                    ? $"Este {nombreDocumento} ya está registrado."
                    : $"{nombreDocumento} válido y disponible para registrar."
        });
    }

    [HttpGet("validar-cedula/{cedula}")]
    public Task<IActionResult> ValidarCedula(
        string cedula,
        int? idCliente = null,
        CancellationToken cancellationToken = default) =>
        ValidarDocumento(
            cedula,
            PersonaFisica,
            idCliente,
            cancellationToken);

    [HttpPost]
    public async Task<ActionResult<Cliente>> PostCliente(
        Cliente cliente,
        CancellationToken cancellationToken)
    {
        NormalizarCliente(cliente);
        var validationError = ValidarCliente(cliente);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        if (await context.Clientes.AnyAsync(
                item => item.Cedula == cliente.Cedula,
                cancellationToken))
        {
            return Conflict(
                $"Ya existe un cliente registrado con este {ObtenerNombreDocumento(cliente.TipoPersona)}.");
        }

        context.Clientes.Add(cliente);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, cliente);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> PutCliente(
        int id,
        Cliente cliente,
        CancellationToken cancellationToken)
    {
        if (id != cliente.Id)
        {
            return BadRequest("El ID del cliente no coincide.");
        }

        var current = await context.Clientes
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (current is null)
        {
            return NotFound("El cliente solicitado no existe.");
        }

        NormalizarCliente(cliente);
        var validationError = ValidarCliente(cliente);
        if (validationError is not null)
        {
            return BadRequest(validationError);
        }

        if (await context.Clientes.AnyAsync(
                item => item.Cedula == cliente.Cedula && item.Id != id,
                cancellationToken))
        {
            return Conflict(
                $"Ya existe otro cliente registrado con este {ObtenerNombreDocumento(cliente.TipoPersona)}.");
        }

        current.Nombre = cliente.Nombre;
        current.Cedula = cliente.Cedula;
        current.LimiteCredito = cliente.LimiteCredito;
        current.Estado = cliente.Estado;
        current.TipoPersona = cliente.TipoPersona;

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = AppRoles.Administrador)]
    public async Task<IActionResult> DeleteCliente(
        int id,
        CancellationToken cancellationToken)
    {
        var cliente = await context.Clientes
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (cliente is null)
        {
            return NotFound("El cliente solicitado no existe.");
        }

        if (await context.Rentas.AnyAsync(
                item => item.IdCliente == id,
                cancellationToken))
        {
            return BadRequest(
                "No se puede eliminar el cliente porque tiene rentas registradas.");
        }

        context.Clientes.Remove(cliente);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static void NormalizarCliente(Cliente cliente)
    {
        cliente.Nombre = (cliente.Nombre ?? string.Empty).Trim();
        cliente.TipoPersona = NormalizarTipoPersona(cliente.TipoPersona);
        cliente.Cedula = LimpiarDocumento(cliente.Cedula);
    }

    private static string? ValidarCliente(Cliente cliente)
    {
        if (string.IsNullOrWhiteSpace(cliente.Nombre) || cliente.Nombre.Length > 150)
        {
            return cliente.TipoPersona == PersonaJuridica
                ? "La razón social debe contener entre 3 y 150 caracteres."
                : "El nombre debe contener entre 3 y 150 caracteres.";
        }

        if (!DocumentoValido(cliente.Cedula, cliente.TipoPersona))
        {
            return cliente.TipoPersona == PersonaJuridica
                ? "El RNC ingresado no es válido."
                : "La cédula ingresada no es válida.";
        }

        return cliente.LimiteCredito is < 0 or > 100_000_000
            ? "El límite de crédito debe estar entre 0 y 100,000,000."
            : null;
    }

    private static string NormalizarTipoPersona(string? tipoPersona) =>
        string.Equals(tipoPersona, PersonaJuridica, StringComparison.OrdinalIgnoreCase)
            ? PersonaJuridica
            : PersonaFisica;

    private static string ObtenerNombreDocumento(string? tipoPersona) =>
        NormalizarTipoPersona(tipoPersona) == PersonaJuridica ? "RNC" : "cédula";

    private static string LimpiarDocumento(string? documento) =>
        string.IsNullOrWhiteSpace(documento)
            ? string.Empty
            : new string(documento.Where(char.IsDigit).ToArray());

    private static bool DocumentoValido(string documento, string? tipoPersona) =>
        NormalizarTipoPersona(tipoPersona) == PersonaJuridica
            ? RncValido(documento)
            : CedulaValida(documento);

    private static string FormatearDocumento(string documento, string? tipoPersona)
    {
        documento = LimpiarDocumento(documento);
        if (NormalizarTipoPersona(tipoPersona) == PersonaJuridica)
        {
            return documento.Length == 9
                ? $"{documento[..3]}-{documento.Substring(3, 5)}-{documento[8]}"
                : documento;
        }

        return documento.Length == 11
            ? $"{documento[..3]}-{documento.Substring(3, 7)}-{documento[10]}"
            : documento;
    }

    private static bool CedulaValida(string cedula)
    {
        cedula = LimpiarDocumento(cedula);
        if (cedula.Length != 11 || cedula.All(character => character == cedula[0]))
        {
            return false;
        }

        int[] weights = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
        var sum = 0;
        for (var index = 0; index < 10; index++)
        {
            var value = (cedula[index] - '0') * weights[index];
            sum += value >= 10 ? (value / 10) + (value % 10) : value;
        }

        return (10 - sum % 10) % 10 == cedula[10] - '0';
    }

    private static bool RncValido(string rnc)
    {
        rnc = LimpiarDocumento(rnc);
        if (rnc.Length != 9 || rnc.All(character => character == rnc[0]))
        {
            return false;
        }

        int[] weights = [7, 9, 8, 6, 5, 4, 3, 2];
        var sum = 0;
        for (var index = 0; index < 8; index++)
        {
            sum += (rnc[index] - '0') * weights[index];
        }

        var remainder = sum % 11;
        var checkDigit = remainder switch
        {
            0 => 2,
            1 => 1,
            _ => 11 - remainder
        };
        return checkDigit == rnc[8] - '0';
    }
}
