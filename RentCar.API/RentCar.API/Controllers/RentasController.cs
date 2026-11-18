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
/// Rentas y devoluciones. Disponible para Admin y Empleado.
///
/// Reglas de negocio (v1.2, conservadas):
/// - Solo se renta un vehículo en estado Disponible.
/// - Regla académica: un vehículo que ya tuvo una renta (activa o concluida) no vuelve a rentarse;
///   al devolverse queda NoDisponible. Está documentada en README y en la interfaz.
/// - Las rentas no se eliminan: forman parte del historial.
/// - ITBIS académico del 18 % sobre el subtotal.
///
/// FechaDevolucion es la fecha REAL de devolución (se fija al procesarla).
/// FechaDevolucionPrevista = FechaRenta + CantidadDias (calculada, no persistida).
/// </summary>
[Route("api/[controller]")]
[ApiController]
public class RentasController(RentCarDbContext context, IFechaNegocio fechaNegocio) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RentaResponse>>> GetRentas(CancellationToken cancellationToken)
    {
        var rentas = await ConsultaRespuestas().ToListAsync(cancellationToken);

        return Ok(rentas.Select(AResponse));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RentaResponse>> GetRenta(int id, CancellationToken cancellationToken)
    {
        var renta = await ConsultaRespuestas(id).FirstOrDefaultAsync(cancellationToken);

        return renta is null
            ? NotFound("La renta solicitada no existe.")
            : Ok(AResponse(renta));
    }

    [HttpPost]
    public async Task<ActionResult<RentaResponse>> PostRenta(CrearRentaRequest request, CancellationToken cancellationToken)
    {
        // 1. Identidad: el empleado responsable sale exclusivamente del JWT firmado.
        var empleadoId = User.EmpleadoId();
        if (empleadoId is null)
        {
            return Forbid();
        }

        var empleado = await context.Empleados
            .AsNoTracking()
            .Where(e => e.Id == empleadoId)
            .Select(e => new { e.Id, e.Estado })
            .SingleOrDefaultAsync(cancellationToken);

        if (empleado is null || !empleado.Estado)
        {
            return Forbid();
        }

        // 2. Cliente existente y activo.
        var cliente = await context.Clientes
            .AsNoTracking()
            .Where(c => c.Id == request.IdCliente)
            .Select(c => new { c.Id, c.Estado })
            .SingleOrDefaultAsync(cancellationToken);

        if (cliente is null)
        {
            return BadRequest("El cliente seleccionado no existe.");
        }

        if (!cliente.Estado)
        {
            return BadRequest("El cliente seleccionado está inactivo.");
        }

        // 3. Vehículo existente, disponible y nunca rentado (regla académica).
        var vehiculo = await context.Vehiculos
            .FirstOrDefaultAsync(v => v.Id == request.IdVehiculo, cancellationToken);

        if (vehiculo is null)
        {
            return BadRequest("El vehículo seleccionado no existe.");
        }

        var estadoOperacion = NormalizarEstado(vehiculo);
        if (estadoOperacion != EstadosVehiculo.Disponible)
        {
            return Conflict(estadoOperacion == EstadosVehiculo.NoDisponible
                ? "Este vehículo fue devuelto o está marcado como no disponible."
                : "Este vehículo se encuentra rentado actualmente.");
        }

        if (await context.Rentas.AnyAsync(r => r.IdVehiculo == request.IdVehiculo, cancellationToken))
        {
            return Conflict("Este vehículo ya fue rentado anteriormente y no puede volver a rentarse.");
        }

        var (subtotal, itbis, total) = CalculadoraRenta.Calcular(request.MontoXDia, request.CantidadDias);

        var renta = new Renta
        {
            IdEmpleado = empleado.Id,
            IdCliente = cliente.Id,
            IdVehiculo = vehiculo.Id,
            FechaRenta = request.FechaRenta!.Value.Date,
            FechaDevolucion = null,
            MontoXdia = request.MontoXDia,
            CantidadDias = request.CantidadDias,
            Subtotal = subtotal,
            Itbis = itbis,
            Total = total,
            Comentario = request.Comentario?.Trim() ?? string.Empty,
            Estado = EstadosRenta.Activa
        };

        // 4. Atomicidad y concurrencia: la renta y el cambio de estado del vehículo se guardan
        //    en una sola transacción. EstadoOperacion es token de concurrencia, de modo que el
        //    UPDATE solo afecta al vehículo si sigue Disponible. Además, el índice único filtrado
        //    UX_Rentas_IdVehiculo_Activa impide dos rentas activas del mismo vehículo.
        //    Si dos solicitudes compiten, una gana y la otra recibe 409 (DbExceptionHandler).
        vehiculo.Estado = false;
        vehiculo.EstadoOperacion = EstadosVehiculo.Rentado;
        context.Rentas.Add(renta);
        await context.SaveChangesAsync(cancellationToken);

        var respuesta = await ConsultaRespuestas(renta.NoRenta).SingleAsync(cancellationToken);

        return CreatedAtAction(nameof(GetRenta), new { id = renta.NoRenta }, AResponse(respuesta));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> PutRenta(int id, ActualizarRentaRequest request, CancellationToken cancellationToken)
    {
        var renta = await context.Rentas.FirstOrDefaultAsync(r => r.NoRenta == id, cancellationToken);

        if (renta is null)
        {
            return NotFound("La renta solicitada no existe.");
        }

        if (EsConcluida(renta))
        {
            return Conflict("Una renta concluida no puede ser modificada.");
        }

        renta.MontoXdia = request.MontoXDia;
        renta.CantidadDias = request.CantidadDias;
        renta.Comentario = request.Comentario?.Trim() ?? string.Empty;
        (renta.Subtotal, renta.Itbis, renta.Total) = CalculadoraRenta.Calcular(renta.MontoXdia, renta.CantidadDias);

        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:int}/devolucion")]
    public async Task<IActionResult> DevolverVehiculo(int id, CancellationToken cancellationToken)
    {
        var renta = await context.Rentas.FirstOrDefaultAsync(r => r.NoRenta == id, cancellationToken);

        if (renta is null)
        {
            return NotFound("La renta seleccionada no existe.");
        }

        if (EsConcluida(renta))
        {
            var fechaRegistrada = renta.FechaDevolucion?.ToString("dd/MM/yyyy") ?? "sin fecha registrada";
            return Conflict($"Esta renta ya fue concluida el {fechaRegistrada}.");
        }

        var vehiculo = await context.Vehiculos.FirstOrDefaultAsync(v => v.Id == renta.IdVehiculo, cancellationToken);

        if (vehiculo is null)
        {
            return Conflict("No se encontró el vehículo asociado a esta renta.");
        }

        // Renta.Estado y Vehiculo.EstadoOperacion son tokens de concurrencia: una segunda
        // devolución simultánea no puede concluir la renta dos veces (recibe 409).
        renta.Estado = EstadosRenta.Concluida;
        renta.FechaDevolucion = fechaNegocio.Hoy();

        // Los importes contractuales no cambian en la devolución: se conservan los pactados.
        vehiculo.Estado = false;
        vehiculo.EstadoOperacion = EstadosVehiculo.NoDisponible;

        await context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            mensaje = "Vehículo devuelto correctamente.",
            renta.NoRenta,
            renta.Estado,
            renta.FechaDevolucion,
            fechaDevolucionPrevista = CalculadoraRenta.FechaPrevista(renta.FechaRenta, renta.CantidadDias),
            renta.Subtotal,
            renta.Itbis,
            renta.Total,
            idVehiculo = vehiculo.Id,
            estadoVehiculo = vehiculo.EstadoOperacion
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> DeleteRenta(int id, CancellationToken cancellationToken)
    {
        if (!await context.Rentas.AnyAsync(r => r.NoRenta == id, cancellationToken))
        {
            return NotFound("La renta seleccionada no existe.");
        }

        return Conflict("Las rentas no pueden eliminarse porque forman parte del historial del vehículo.");
    }

    /// <summary>Rentas con el nombre del empleado responsable (sin exponer el listado de empleados).</summary>
    private IQueryable<RentaConEmpleado> ConsultaRespuestas(int? noRenta = null) =>
        from renta in context.Rentas.AsNoTracking()
        where noRenta == null || renta.NoRenta == noRenta
        join empleado in context.Empleados.AsNoTracking() on renta.IdEmpleado equals empleado.Id into empleados
        from empleado in empleados.DefaultIfEmpty()
        orderby renta.NoRenta descending
        select new RentaConEmpleado(renta, empleado == null ? null : empleado.Nombre);

    private static RentaResponse AResponse(RentaConEmpleado fila) => new(
        fila.Renta.NoRenta,
        fila.Renta.IdEmpleado,
        fila.NombreEmpleado ?? $"Empleado #{fila.Renta.IdEmpleado}",
        fila.Renta.IdVehiculo,
        fila.Renta.IdCliente,
        fila.Renta.FechaRenta,
        CalculadoraRenta.FechaPrevista(fila.Renta.FechaRenta, fila.Renta.CantidadDias),
        fila.Renta.FechaDevolucion,
        fila.Renta.MontoXdia,
        fila.Renta.CantidadDias,
        fila.Renta.Subtotal,
        fila.Renta.Itbis,
        fila.Renta.Total,
        fila.Renta.Comentario,
        fila.Renta.Estado);

    private static bool EsConcluida(Renta renta) =>
        string.Equals(renta.Estado, EstadosRenta.Concluida, StringComparison.OrdinalIgnoreCase);

    private static string NormalizarEstado(Vehiculo vehiculo) =>
        string.IsNullOrWhiteSpace(vehiculo.EstadoOperacion)
            ? (vehiculo.Estado == true ? EstadosVehiculo.Disponible : EstadosVehiculo.Rentado)
            : vehiculo.EstadoOperacion.Trim();

    public sealed record RentaConEmpleado(Renta Renta, string? NombreEmpleado);
}
