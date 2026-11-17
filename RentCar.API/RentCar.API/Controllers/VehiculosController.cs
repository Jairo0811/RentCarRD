using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Domain;
using RentCar.API.Dtos;
using RentCar.API.Infrastructure;
using RentCar.API.Models;

namespace RentCar.API.Controllers;

/// <summary>
/// Flota. Consulta para Admin y Empleado (necesaria para registrar rentas);
/// alta, edición, imágenes y eliminación exclusivas de Admin.
/// </summary>
[Route("api/[controller]")]
[ApiController]
public partial class VehiculosController(RentCarDbContext context, AlmacenImagenesVehiculos imagenes) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Vehiculo>>> GetVehiculos(CancellationToken cancellationToken) =>
        Ok(await context.Vehiculos.AsNoTracking().OrderByDescending(v => v.Id).ToListAsync(cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Vehiculo>> GetVehiculo(int id, CancellationToken cancellationToken)
    {
        var vehiculo = await context.Vehiculos.AsNoTracking().FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        return vehiculo is null ? NotFound("El vehículo solicitado no existe.") : Ok(vehiculo);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<Vehiculo>> PostVehiculo(VehiculoRequest request, CancellationToken cancellationToken)
    {
        Normalizar(request);
        var error = Validar(request) ?? await ValidarReferencias(request, cancellationToken);
        if (error is not null)
        {
            return BadRequest(error);
        }

        if (request.EstadoOperacion == EstadosVehiculo.Rentado)
        {
            return BadRequest("Un vehículo nuevo no puede registrarse como Rentado; el estado lo asigna el flujo de rentas.");
        }

        var duplicado = await BuscarDuplicado(request, idActual: null, cancellationToken);
        if (duplicado is not null)
        {
            return Conflict(duplicado);
        }

        var vehiculo = new Vehiculo();
        Aplicar(vehiculo, request);
        vehiculo.EstadoOperacion = request.EstadoOperacion!;
        vehiculo.Estado = vehiculo.EstadoOperacion == EstadosVehiculo.Disponible;

        context.Vehiculos.Add(vehiculo);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetVehiculo), new { id = vehiculo.Id }, vehiculo);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> PutVehiculo(int id, VehiculoRequest request, CancellationToken cancellationToken)
    {
        var vehiculo = await context.Vehiculos.FirstOrDefaultAsync(v => v.Id == id, cancellationToken);
        if (vehiculo is null)
        {
            return NotFound("El vehículo solicitado no existe.");
        }

        Normalizar(request);
        var error = Validar(request) ?? await ValidarReferencias(request, cancellationToken);
        if (error is not null)
        {
            return BadRequest(error);
        }

        var duplicado = await BuscarDuplicado(request, id, cancellationToken);
        if (duplicado is not null)
        {
            return Conflict(duplicado);
        }

        var errorEstado = await ValidarCambioEstado(vehiculo, request.EstadoOperacion!, cancellationToken);
        if (errorEstado is not null)
        {
            return Conflict(errorEstado);
        }

        // ImagenUrl no se toma del cliente: solo cambia mediante el endpoint de carga.
        Aplicar(vehiculo, request);
        vehiculo.EstadoOperacion = request.EstadoOperacion!;
        vehiculo.Estado = vehiculo.EstadoOperacion == EstadosVehiculo.Disponible;

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:int}/imagen")]
    [Authorize(Roles = Roles.Admin)]
    [RequestSizeLimit(AlmacenImagenesVehiculos.TamanoMaximoBytes + 64 * 1024)]
    public async Task<IActionResult> SubirImagen(int id, [FromForm(Name = "imagen")] IFormFile? imagen, CancellationToken cancellationToken)
    {
        var vehiculo = await context.Vehiculos.FindAsync([id], cancellationToken);
        if (vehiculo is null)
        {
            return NotFound("Vehículo no encontrado.");
        }

        if (imagen is null)
        {
            return BadRequest("No se recibió ninguna imagen.");
        }

        var resultado = await imagenes.GuardarAsync(imagen, cancellationToken);
        if (!resultado.Exito)
        {
            return BadRequest(resultado.Error);
        }

        var anterior = vehiculo.ImagenUrl;
        vehiculo.ImagenUrl = AlmacenImagenesVehiculos.Url(resultado.NombreArchivo!);

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            // Consistencia archivo ↔ base: si no se guardó la referencia, se descarta el archivo nuevo.
            imagenes.Eliminar(resultado.NombreArchivo);
            throw;
        }

        // Solo tras confirmar la base de datos se elimina la imagen anterior.
        imagenes.Eliminar(anterior);

        return Ok(new { vehiculo.Id, vehiculo.ImagenUrl });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> DeleteVehiculo(int id, CancellationToken cancellationToken)
    {
        var vehiculo = await context.Vehiculos.FindAsync([id], cancellationToken);
        if (vehiculo is null)
        {
            return NotFound("El vehículo solicitado no existe.");
        }

        if (await context.Rentas.AnyAsync(r => r.IdVehiculo == id, cancellationToken))
        {
            return Conflict("No se puede eliminar el vehículo porque tiene rentas registradas.");
        }

        if (await context.Inspecciones.AnyAsync(i => i.IdVehiculo == id, cancellationToken))
        {
            return Conflict("No se puede eliminar el vehículo porque tiene inspecciones registradas.");
        }

        var imagen = vehiculo.ImagenUrl;
        context.Vehiculos.Remove(vehiculo);
        await context.SaveChangesAsync(cancellationToken);
        imagenes.Eliminar(imagen);

        return NoContent();
    }

    /// <summary>
    /// Transiciones manuales permitidas:
    /// - Rentado solo lo asigna/retira el flujo de rentas.
    /// - Disponible → NoDisponible: retirar de servicio (si no tiene renta activa).
    /// - NoDisponible → Disponible: solo si el vehículo nunca fue rentado (regla académica).
    /// </summary>
    private async Task<string?> ValidarCambioEstado(Vehiculo vehiculo, string nuevoEstado, CancellationToken cancellationToken)
    {
        var actual = string.IsNullOrWhiteSpace(vehiculo.EstadoOperacion) ? EstadosVehiculo.Disponible : vehiculo.EstadoOperacion;
        if (actual == nuevoEstado)
            return null;
        if (actual == EstadosVehiculo.Rentado)
            return "El vehículo está rentado; su estado cambia al procesar la devolución.";
        if (nuevoEstado == EstadosVehiculo.Rentado)
            return "El estado Rentado lo asigna únicamente el registro de una renta.";
        if (nuevoEstado == EstadosVehiculo.Disponible &&
            await context.Rentas.AnyAsync(r => r.IdVehiculo == vehiculo.Id, cancellationToken))
            return "Este vehículo ya fue rentado y devuelto; por regla académica no vuelve a estar disponible.";
        return null;
    }

    private static void Normalizar(VehiculoRequest r)
    {
        r.Descripcion = r.Descripcion?.Trim();
        r.NoPlaca = LimpiarAlfanumerico(r.NoPlaca);
        r.NoChasis = LimpiarAlfanumerico(r.NoChasis);
        r.NoMotor = LimpiarAlfanumerico(r.NoMotor);

        if (r.IdTipoCombustible is null or <= 0)
            r.IdTipoCombustible = r.IdCombustible;
        r.IdCombustible = r.IdTipoCombustible;

        r.EstadoOperacion = EstadosVehiculo.Todos.FirstOrDefault(e =>
            string.Equals(e, r.EstadoOperacion?.Replace(" ", string.Empty), StringComparison.OrdinalIgnoreCase))
            ?? (string.IsNullOrWhiteSpace(r.EstadoOperacion) ? EstadosVehiculo.Disponible : r.EstadoOperacion);
    }

    private static string? Validar(VehiculoRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Descripcion))
            return "La descripción del vehículo es obligatoria.";
        if (r.IdMarca is null or <= 0)
            return "Debe seleccionar una marca válida.";
        if (r.IdModelo is null or <= 0)
            return "Debe seleccionar un modelo válido.";
        if (r.IdTipoVehiculo is null or <= 0)
            return "Debe seleccionar un tipo de vehículo válido.";
        if (r.IdTipoCombustible is null or <= 0)
            return "Debe seleccionar un tipo de combustible válido.";
        if (string.IsNullOrWhiteSpace(r.NoPlaca))
            return "El número de placa es obligatorio.";
        if (!Placa().IsMatch(r.NoPlaca))
            return "La placa debe contener entre 6 y 7 caracteres alfanuméricos.";
        if (r.NoChasis is not null && !Chasis().IsMatch(r.NoChasis))
            return "El chasis debe contener únicamente letras y números, con un máximo de 17 caracteres.";
        if (r.NoMotor is not null && !Motor().IsMatch(r.NoMotor))
            return "El número de motor debe contener únicamente letras y números (máximo 50).";
        if (!EstadosVehiculo.Todos.Contains(r.EstadoOperacion))
            return "El estado operativo del vehículo no es válido.";
        return null;
    }

    private async Task<string?> ValidarReferencias(VehiculoRequest r, CancellationToken cancellationToken)
    {
        if (!await context.Marcas.AnyAsync(m => m.Id == r.IdMarca, cancellationToken))
            return "La marca seleccionada no existe.";
        var modelo = await context.Modelos.AsNoTracking().FirstOrDefaultAsync(m => m.Id == r.IdModelo, cancellationToken);
        if (modelo is null)
            return "El modelo seleccionado no existe.";
        if (modelo.IdMarca != r.IdMarca)
            return "El modelo seleccionado no pertenece a la marca indicada.";
        if (!await context.TiposVehiculos.AnyAsync(t => t.Id == r.IdTipoVehiculo, cancellationToken))
            return "El tipo de vehículo seleccionado no existe.";
        if (!await context.TiposCombustibles.AnyAsync(t => t.Id == r.IdTipoCombustible, cancellationToken))
            return "El tipo de combustible seleccionado no existe.";
        return null;
    }

    private async Task<string?> BuscarDuplicado(VehiculoRequest r, int? idActual, CancellationToken cancellationToken)
    {
        if (await context.Vehiculos.AnyAsync(v => v.NoPlaca == r.NoPlaca && v.Id != idActual, cancellationToken))
            return "Ya existe un vehículo registrado con esta placa.";
        if (r.NoChasis is not null &&
            await context.Vehiculos.AnyAsync(v => v.NoChasis == r.NoChasis && v.Id != idActual, cancellationToken))
            return "Ya existe un vehículo registrado con este número de chasis.";
        return null;
    }

    private static void Aplicar(Vehiculo v, VehiculoRequest r)
    {
        v.Descripcion = r.Descripcion;
        v.NoPlaca = r.NoPlaca;
        v.NoChasis = r.NoChasis;
        v.NoMotor = r.NoMotor;
        v.IdMarca = r.IdMarca;
        v.IdModelo = r.IdModelo;
        v.IdTipoVehiculo = r.IdTipoVehiculo;
        v.IdTipoCombustible = r.IdTipoCombustible;
        v.IdCombustible = r.IdCombustible;
    }

    private static string? LimpiarAlfanumerico(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor))
            return null;
        var limpio = new string(valor.ToUpperInvariant().Where(char.IsAsciiLetterOrDigit).ToArray());
        return limpio.Length == 0 ? null : limpio;
    }

    [GeneratedRegex("^[A-Z0-9]{6,7}$")]
    private static partial Regex Placa();

    [GeneratedRegex("^[A-Z0-9]{1,17}$")]
    private static partial Regex Chasis();

    [GeneratedRegex("^[A-Z0-9]{1,50}$")]
    private static partial Regex Motor();
}
