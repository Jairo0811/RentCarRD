using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Auth;
using RentCar.API.Domain;
using RentCar.API.Dtos;
using RentCar.API.Infrastructure;
using RentCar.API.Models;

namespace RentCar.API.Controllers;

/// <summary>
/// Inspecciones de flota. En la interfaz v1.2 el módulo es exclusivo del administrador;
/// la API aplica la misma regla. El inspector se toma del JWT, no del cuerpo de la solicitud.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = Roles.Admin)]
public class InspeccionesController(RentCarDbContext context, IFechaNegocio fechaNegocio) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Inspeccione>>> GetInspecciones(CancellationToken cancellationToken) =>
        Ok(await context.Inspecciones.AsNoTracking().OrderByDescending(i => i.IdTransaccion).ToListAsync(cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Inspeccione>> GetInspeccion(int id, CancellationToken cancellationToken)
    {
        var inspeccion = await context.Inspecciones.AsNoTracking().FirstOrDefaultAsync(i => i.IdTransaccion == id, cancellationToken);
        return inspeccion is null ? NotFound("La inspección solicitada no existe.") : Ok(inspeccion);
    }

    [HttpPost]
    public async Task<ActionResult<Inspeccione>> PostInspeccion(InspeccionRequest request, CancellationToken cancellationToken)
    {
        var empleadoId = User.EmpleadoId();
        if (empleadoId is null)
            return Forbid();

        var error = await Validar(request, cancellationToken);
        if (error is not null)
            return BadRequest(error);

        var inspeccion = new Inspeccione { IdEmpleadoInspeccion = empleadoId.Value };
        Aplicar(inspeccion, request);
        context.Inspecciones.Add(inspeccion);
        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetInspeccion), new { id = inspeccion.IdTransaccion }, inspeccion);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> PutInspeccion(int id, InspeccionRequest request, CancellationToken cancellationToken)
    {
        var inspeccion = await context.Inspecciones.FirstOrDefaultAsync(i => i.IdTransaccion == id, cancellationToken);
        if (inspeccion is null)
            return NotFound("La inspección solicitada no existe.");

        var error = await Validar(request, cancellationToken);
        if (error is not null)
            return BadRequest(error);

        // El inspector original se conserva: editar no reatribuye la inspección.
        Aplicar(inspeccion, request);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteInspeccion(int id, CancellationToken cancellationToken)
    {
        var inspeccion = await context.Inspecciones.FirstOrDefaultAsync(i => i.IdTransaccion == id, cancellationToken);
        if (inspeccion is null)
            return NotFound("La inspección solicitada no existe.");

        context.Inspecciones.Remove(inspeccion);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<string?> Validar(InspeccionRequest r, CancellationToken cancellationToken)
    {
        if (!NivelesCombustible.Todos.Contains(r.CantidadCombustible))
            return "El nivel de combustible debe ser 1/4, 1/2, 3/4 o Lleno.";
        if (!await context.Vehiculos.AnyAsync(v => v.Id == r.IdVehiculo, cancellationToken))
            return "El vehículo seleccionado no existe.";
        if (!await context.Clientes.AnyAsync(c => c.Id == r.IdCliente, cancellationToken))
            return "El cliente seleccionado no existe.";
        if (r.Fecha.HasValue && r.Fecha.Value.Date > fechaNegocio.Hoy())
            return "La fecha de inspección no puede estar en el futuro.";
        return null;
    }

    private void Aplicar(Inspeccione i, InspeccionRequest r)
    {
        i.IdVehiculo = r.IdVehiculo;
        i.IdCliente = r.IdCliente;
        i.TieneRalladuras = r.TieneRalladuras;
        i.CantidadCombustible = r.CantidadCombustible;
        i.TieneGomaRespuesta = r.TieneGomaRespuesta;
        i.TieneGato = r.TieneGato;
        i.TieneRoturasCristal = r.TieneRoturasCristal;
        i.GomaDelanteraDerecha = r.GomaDelanteraDerecha;
        i.GomaDelanteraIzquierda = r.GomaDelanteraIzquierda;
        i.GomaTraseraDerecha = r.GomaTraseraDerecha;
        i.GomaTraseraIzquierda = r.GomaTraseraIzquierda;
        i.Fecha = (r.Fecha ?? fechaNegocio.Hoy()).Date;
        i.Estado = r.Estado;
    }
}
