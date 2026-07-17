using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RentasController : ControllerBase
    {
        private const decimal TasaItbis = 0.18m;

        private const string EstadoRentaActiva = "Activa";
        private const string EstadoRentaConcluida = "Concluida";

        private const string VehiculoDisponible = "Disponible";
        private const string VehiculoRentado = "Rentado";
        private const string VehiculoNoDisponible = "NoDisponible";

        private readonly RentCarDbContext _context;

        public RentasController(RentCarDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Renta>>> GetRentas()
        {
            var rentas = await _context.Rentas
                .AsNoTracking()
                .OrderByDescending(r => r.NoRenta)
                .ToListAsync();

            return Ok(rentas);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Renta>> GetRenta(int id)
        {
            var renta = await _context.Rentas
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.NoRenta == id);

            if (renta == null)
            {
                return NotFound("La renta solicitada no existe.");
            }

            return Ok(renta);
        }

        [HttpPost]
        public async Task<ActionResult<Renta>> PostRenta(Renta renta)
        {
            var errorValidacion = ValidarRenta(renta);

            if (errorValidacion != null)
            {
                return BadRequest(errorValidacion);
            }

            var vehiculo = await _context.Vehiculos
                .FirstOrDefaultAsync(v => v.Id == renta.IdVehiculo);

            if (vehiculo == null)
            {
                return BadRequest(
                    "El vehículo seleccionado no existe."
                );
            }

            var estadoOperacion =
                NormalizarEstadoOperacion(vehiculo);

            if (estadoOperacion != VehiculoDisponible)
            {
                return BadRequest(
                    estadoOperacion == VehiculoNoDisponible
                        ? "Este vehículo fue devuelto y está marcado como no disponible."
                        : "Este vehículo se encuentra rentado actualmente."
                );
            }

            var fueRentadoAnteriormente =
                await _context.Rentas.AnyAsync(
                    r => r.IdVehiculo == renta.IdVehiculo
                );

            if (fueRentadoAnteriormente)
            {
                return BadRequest(
                    "Este vehículo ya fue rentado anteriormente y no puede volver a rentarse."
                );
            }

            var clienteExiste =
                await _context.Clientes.AnyAsync(
                    c => c.Id == renta.IdCliente
                );

            if (!clienteExiste)
            {
                return BadRequest(
                    "El cliente seleccionado no existe."
                );
            }

            var empleadoExiste =
                await _context.Empleados.AnyAsync(
                    e => e.Id == renta.IdEmpleado
                );

            if (!empleadoExiste)
            {
                return BadRequest(
                    "El empleado seleccionado no existe."
                );
            }

            CalcularTotales(renta);

            renta.Estado = EstadoRentaActiva;
            renta.FechaDevolucion = null;
            renta.Comentario =
                renta.Comentario?.Trim() ?? string.Empty;

            vehiculo.Estado = false;
            vehiculo.EstadoOperacion = VehiculoRentado;

            _context.Rentas.Add(renta);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetRenta),
                new { id = renta.NoRenta },
                renta
            );
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutRenta(
            int id,
            Renta renta
        )
        {
            if (id != renta.NoRenta)
            {
                return BadRequest(
                    "El ID de la renta no coincide."
                );
            }

            var rentaActual = await _context.Rentas
                .FirstOrDefaultAsync(
                    r => r.NoRenta == id
                );

            if (rentaActual == null)
            {
                return NotFound(
                    "La renta solicitada no existe."
                );
            }

            if (EsRentaConcluida(rentaActual))
            {
                return BadRequest(
                    "Una renta concluida no puede ser modificada."
                );
            }

            if (renta.MontoXdia <= 0)
            {
                return BadRequest(
                    "El monto por día debe ser mayor que cero."
                );
            }

            if (renta.CantidadDias <= 0)
            {
                return BadRequest(
                    "La cantidad de días debe ser mayor que cero."
                );
            }

            rentaActual.MontoXdia = renta.MontoXdia;
            rentaActual.CantidadDias = renta.CantidadDias;
            rentaActual.Comentario =
                renta.Comentario?.Trim() ?? string.Empty;

            CalcularTotales(rentaActual);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id:int}/devolucion")]
        public async Task<IActionResult> DevolverVehiculo(
            int id
        )
        {
            var renta = await _context.Rentas
                .FirstOrDefaultAsync(
                    r => r.NoRenta == id
                );

            if (renta == null)
            {
                return NotFound(
                    "La renta seleccionada no existe."
                );
            }

            if (EsRentaConcluida(renta))
            {
                var fechaRegistrada =
                    renta.FechaDevolucion?.ToString(
                        "dd/MM/yyyy"
                    ) ?? "sin fecha registrada";

                return BadRequest(
                    $"Esta renta ya fue concluida el {fechaRegistrada}."
                );
            }

            var vehiculo = await _context.Vehiculos
                .FirstOrDefaultAsync(
                    v => v.Id == renta.IdVehiculo
                );

            if (vehiculo == null)
            {
                return BadRequest(
                    "No se encontró el vehículo asociado a esta renta."
                );
            }

            renta.Estado = EstadoRentaConcluida;

            renta.FechaDevolucion =
                renta.FechaRenta.Date.AddDays(
                    renta.CantidadDias
                );

            CalcularTotales(renta);

            vehiculo.Estado = false;
            vehiculo.EstadoOperacion =
                VehiculoNoDisponible;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mensaje =
                    "Vehículo devuelto correctamente.",
                renta.NoRenta,
                renta.Estado,
                renta.FechaDevolucion,
                renta.Subtotal,
                renta.Itbis,
                renta.Total,
                idVehiculo = vehiculo.Id,
                estadoVehiculo =
                    vehiculo.EstadoOperacion
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteRenta(
            int id
        )
        {
            var rentaExiste =
                await _context.Rentas.AnyAsync(
                    r => r.NoRenta == id
                );

            if (!rentaExiste)
            {
                return NotFound(
                    "La renta seleccionada no existe."
                );
            }

            return BadRequest(
                "Las rentas no pueden eliminarse porque forman parte del historial del vehículo."
            );
        }

        private static void CalcularTotales(
            Renta renta
        )
        {
            renta.Subtotal = Math.Round(
                renta.MontoXdia * renta.CantidadDias,
                2
            );

            renta.Itbis = Math.Round(
                renta.Subtotal * TasaItbis,
                2
            );

            renta.Total = Math.Round(
                renta.Subtotal + renta.Itbis,
                2
            );
        }

        private static string? ValidarRenta(
            Renta renta
        )
        {
            if (renta.IdVehiculo <= 0)
            {
                return "Debe seleccionar un vehículo válido.";
            }

            if (renta.IdCliente <= 0)
            {
                return "Debe seleccionar un cliente válido.";
            }

            if (renta.IdEmpleado <= 0)
            {
                return "Debe seleccionar un empleado válido.";
            }

            if (renta.FechaRenta == default)
            {
                return "Debe indicar una fecha de renta válida.";
            }

            if (renta.MontoXdia <= 0)
            {
                return "El monto por día debe ser mayor que cero.";
            }

            if (renta.CantidadDias <= 0)
            {
                return "La cantidad de días debe ser mayor que cero.";
            }

            return null;
        }

        private static bool EsRentaConcluida(
            Renta renta
        )
        {
            return string.Equals(
                renta.Estado,
                EstadoRentaConcluida,
                StringComparison.OrdinalIgnoreCase
            );
        }

        private static string NormalizarEstadoOperacion(
            Vehiculo vehiculo
        )
        {
            if (!string.IsNullOrWhiteSpace(
                vehiculo.EstadoOperacion
            ))
            {
                return vehiculo.EstadoOperacion.Trim();
            }

            return vehiculo.Estado == true
                ? VehiculoDisponible
                : VehiculoRentado;
        }
    }
}