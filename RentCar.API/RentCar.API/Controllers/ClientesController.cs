using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Domain;
using RentCar.API.Dtos;
using RentCar.API.Models;

namespace RentCar.API.Controllers;

/// <summary>
/// Clientes. Admin y Empleado pueden consultar, registrar, editar y eliminar (permisos de v1.2).
/// La eliminación se bloquea (409) si el cliente tiene rentas o inspecciones: debe inactivarse.
///
/// Privacidad: RentCarRD no procesa pagos. El "método de pago" es una referencia simulada
/// (marca + últimos 4 dígitos). No se reciben ni almacenan PAN, titular, expiración ni CVV.
/// </summary>
[Route("api/[controller]")]
[ApiController]
public partial class ClientesController(RentCarDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClienteResponse>>> GetClientes(CancellationToken cancellationToken)
    {
        var clientes = await context.Clientes
            .AsNoTracking()
            .OrderBy(c => c.Nombre)
            .ToListAsync(cancellationToken);

        return Ok(clientes.Select(AResponse));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ClienteResponse>> GetCliente(int id, CancellationToken cancellationToken)
    {
        var cliente = await context.Clientes.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        return cliente is null ? NotFound("El cliente solicitado no existe.") : Ok(AResponse(cliente));
    }

    [HttpGet("validar-documento/{documento}")]
    public async Task<IActionResult> ValidarDocumento(
        string documento,
        string tipoPersona = TiposPersona.Fisica,
        int? idCliente = null,
        CancellationToken cancellationToken = default)
    {
        var tipo = NormalizarTipoPersona(tipoPersona);
        var limpio = DocumentosDominicanos.SoloDigitos(documento);
        var esValido = DocumentoValido(limpio, tipo);
        var nombreDocumento = tipo == TiposPersona.Juridica ? "RNC" : "cédula";

        var existente = await context.Clientes
            .AsNoTracking()
            .Where(c => c.Cedula == limpio && (!idCliente.HasValue || c.Id != idCliente.Value))
            .Select(c => new { c.Nombre })
            .FirstOrDefaultAsync(cancellationToken);

        return Ok(new
        {
            documento = limpio,
            documentoFormateado = tipo == TiposPersona.Juridica
                ? DocumentosDominicanos.FormatearRnc(limpio)
                : DocumentosDominicanos.FormatearCedula(limpio),
            tipoPersona = tipo,
            tipoDocumento = nombreDocumento,
            esValida = esValido && existente is null,
            existe = existente is not null,
            nombreCliente = existente?.Nombre,
            fuente = "Validador local",
            mensaje = !esValido
                ? $"El {nombreDocumento} ingresado no es válido."
                : existente is not null
                    ? $"Este {nombreDocumento} ya pertenece a {existente.Nombre}."
                    : $"{(tipo == TiposPersona.Juridica ? "RNC" : "Cédula")} válido y disponible para registrar."
        });
    }

    // Se conserva para compatibilidad con versiones anteriores del frontend.
    [HttpGet("validar-cedula/{cedula}")]
    public Task<IActionResult> ValidarCedula(string cedula, int? idCliente = null, CancellationToken cancellationToken = default) =>
        ValidarDocumento(cedula, TiposPersona.Fisica, idCliente, cancellationToken);

    [HttpPost]
    public async Task<ActionResult<ClienteResponse>> PostCliente(ClienteRequest request, CancellationToken cancellationToken)
    {
        var (cliente, error) = Construir(request);
        if (error is not null)
        {
            return BadRequest(error);
        }

        if (await context.Clientes.AnyAsync(c => c.Cedula == cliente!.Cedula, cancellationToken))
        {
            return Conflict($"Ya existe un cliente registrado con este {NombreDocumento(cliente!.TipoPersona)}.");
        }

        context.Clientes.Add(cliente!);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetCliente), new { id = cliente!.Id }, AResponse(cliente));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> PutCliente(int id, ClienteRequest request, CancellationToken cancellationToken)
    {
        var existente = await context.Clientes.FindAsync([id], cancellationToken);
        if (existente is null)
        {
            return NotFound("El cliente solicitado no existe.");
        }

        var (cliente, error) = Construir(request);
        if (error is not null)
        {
            return BadRequest(error);
        }

        if (await context.Clientes.AnyAsync(c => c.Cedula == cliente!.Cedula && c.Id != id, cancellationToken))
        {
            return Conflict($"Ya existe otro cliente registrado con este {NombreDocumento(cliente!.TipoPersona)}.");
        }

        existente.Nombre = cliente!.Nombre;
        existente.Cedula = cliente.Cedula;
        existente.TipoPersona = cliente.TipoPersona;
        existente.LimiteCredito = cliente.LimiteCredito;
        existente.Estado = cliente.Estado;
        existente.TipoTarjeta = cliente.TipoTarjeta;
        existente.UltimosDigitosTarjeta = cliente.UltimosDigitosTarjeta;

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteCliente(int id, CancellationToken cancellationToken)
    {
        var cliente = await context.Clientes.FindAsync([id], cancellationToken);
        if (cliente is null)
        {
            return NotFound("El cliente solicitado no existe.");
        }

        if (await context.Rentas.AnyAsync(r => r.IdCliente == id, cancellationToken))
        {
            return Conflict("No se puede eliminar el cliente porque tiene rentas registradas. Puede inactivarlo.");
        }

        if (await context.Inspecciones.AnyAsync(i => i.IdCliente == id, cancellationToken))
        {
            return Conflict("No se puede eliminar el cliente porque tiene inspecciones registradas. Puede inactivarlo.");
        }

        context.Clientes.Remove(cliente);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    internal static (Cliente? Cliente, string? Error) Construir(ClienteRequest request)
    {
        var tipo = NormalizarTipoPersona(request.TipoPersona);
        var cliente = new Cliente
        {
            Nombre = (request.Nombre ?? string.Empty).Trim(),
            Cedula = DocumentosDominicanos.SoloDigitos(request.Cedula),
            TipoPersona = tipo,
            LimiteCredito = request.LimiteCredito,
            Estado = request.Estado
        };

        if (string.IsNullOrWhiteSpace(cliente.Nombre))
        {
            return (null, tipo == TiposPersona.Juridica
                ? "La razón social es obligatoria."
                : "El nombre completo del cliente es obligatorio.");
        }

        if (!DocumentoValido(cliente.Cedula, tipo))
        {
            return (null, tipo == TiposPersona.Juridica
                ? "El RNC ingresado no es válido."
                : "La cédula ingresada no es válida.");
        }

        if (request.LimiteCredito < 0)
        {
            return (null, "El límite de crédito no puede ser negativo.");
        }

        var marca = string.IsNullOrWhiteSpace(request.TipoTarjeta) ? null : request.TipoTarjeta.Trim().ToUpperInvariant();
        var digitos = string.IsNullOrWhiteSpace(request.UltimosDigitosTarjeta) ? null : request.UltimosDigitosTarjeta.Trim();

        if (marca is null && digitos is null)
        {
            return (cliente, null);
        }

        if (digitos is not null && !CuatroDigitos().IsMatch(digitos))
        {
            // Rechazo explícito: si alguien intenta enviar un número completo, no se acepta
            // ni se trunca silenciosamente; el dato nunca llega a persistirse.
            return (null, "Indique únicamente los últimos 4 dígitos de referencia. RentCarRD no admite números de tarjeta completos.");
        }

        if (marca is null || digitos is null)
        {
            return (null, "Para el método de pago simulado indique la marca y los últimos 4 dígitos.");
        }

        if (!MarcasTarjeta.Todas.Contains(marca))
        {
            return (null, "La marca del método de pago no es válida (VISA, MASTERCARD, AMEX o DISCOVER).");
        }

        cliente.TipoTarjeta = marca;
        cliente.UltimosDigitosTarjeta = digitos;
        return (cliente, null);
    }

    private static ClienteResponse AResponse(Cliente c) => new(
        c.Id,
        c.Nombre,
        c.Cedula,
        NormalizarTipoPersona(c.TipoPersona),
        c.LimiteCredito,
        c.Estado,
        c.TipoTarjeta,
        // Defensa adicional para registros históricos: nunca se devuelve más de 4 dígitos.
        string.IsNullOrEmpty(c.UltimosDigitosTarjeta) ? null : c.UltimosDigitosTarjeta[^Math.Min(4, c.UltimosDigitosTarjeta.Length)..]);

    private static string NormalizarTipoPersona(string? tipo) =>
        string.Equals(tipo, TiposPersona.Juridica, StringComparison.OrdinalIgnoreCase)
            ? TiposPersona.Juridica
            : TiposPersona.Fisica;

    private static string NombreDocumento(string? tipo) =>
        NormalizarTipoPersona(tipo) == TiposPersona.Juridica ? "RNC" : "cédula";

    private static bool DocumentoValido(string documento, string tipo) =>
        tipo == TiposPersona.Juridica
            ? DocumentosDominicanos.RncValido(documento)
            : DocumentosDominicanos.CedulaValida(documento);

    [GeneratedRegex("^[0-9]{4}$")]
    private static partial Regex CuatroDigitos();
}
