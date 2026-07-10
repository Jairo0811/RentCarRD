using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RentasController : ControllerBase
    {
        private readonly RentCarDbContext _context;

        public RentasController(RentCarDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Renta>>> GetRentas()
        {
            return await _context.Rentas.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Renta>> GetRenta(int id)
        {
            var renta = await _context.Rentas.FindAsync(id);

            if (renta == null)
                return NotFound();

            return renta;
        }

        [HttpPost]
        [HttpPost]
        public async Task<ActionResult<Renta>> PostRenta(Renta renta)
        {
            if (renta.IdVehiculo <= 0)
                return BadRequest("Debe seleccionar un vehículo válido.");

            if (renta.IdCliente <= 0)
                return BadRequest("Debe seleccionar un cliente válido.");

            if (renta.IdEmpleado <= 0)
                return BadRequest("Debe seleccionar un empleado válido.");

            if (renta.MontoXdia <= 0)
                return BadRequest("El monto por día debe ser mayor que cero.");

            if (renta.CantidadDias <= 0)
                return BadRequest("La cantidad de días debe ser mayor que cero.");

            var vehiculo = await _context.Vehiculos.FindAsync(renta.IdVehiculo);

            if (vehiculo == null)
                return BadRequest("El vehículo seleccionado no existe.");

            /*
             * Regla del negocio:
             * un vehículo que haya sido rentado anteriormente
             * no puede volver a rentarse, aunque la renta esté concluida.
             */
            var vehiculoRentadoAnteriormente = await _context.Rentas.AnyAsync(r =>
                r.IdVehiculo == renta.IdVehiculo
            );

            if (vehiculoRentadoAnteriormente)
            {
                return BadRequest(
                    "Este vehículo ya fue rentado anteriormente y no puede volver a rentarse."
                );
            }

            if (vehiculo.Estado == false)
                return BadRequest("Este vehículo no está disponible para renta.");

            var clienteExiste = await _context.Clientes.AnyAsync(c =>
                c.Id == renta.IdCliente
            );

            if (!clienteExiste)
                return BadRequest("El cliente seleccionado no existe.");

            var empleadoExiste = await _context.Empleados.AnyAsync(e =>
                e.Id == renta.IdEmpleado
            );

            if (!empleadoExiste)
                return BadRequest("El empleado seleccionado no existe.");

            renta.Total = renta.MontoXdia * renta.CantidadDias;
            renta.Estado = "Activa";
            renta.FechaDevolucion = null;

            _context.Rentas.Add(renta);

            // El vehículo deja de estar disponible definitivamente.
            vehiculo.Estado = false;

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetRenta),
                new { id = renta.NoRenta },
                renta
            );
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutRenta(int id, Renta renta)
        {
            if (id != renta.NoRenta)
                return BadRequest("El ID de la renta no coincide.");

            if (renta.MontoXdia <= 0)
                return BadRequest("El monto por día debe ser mayor que cero.");

            if (renta.CantidadDias <= 0)
                return BadRequest("La cantidad de días debe ser mayor que cero.");

            var existeRenta = await _context.Rentas.AnyAsync(r => r.NoRenta == id);

            if (!existeRenta)
                return NotFound();

            renta.Total = renta.MontoXdia * renta.CantidadDias;

            _context.Entry(renta).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("{id}/devolucion")]
        public async Task<IActionResult> DevolverVehiculo(int id)
        {
            var renta = await _context.Rentas.FindAsync(id);

            if (renta == null)
                return NotFound("La renta seleccionada no existe.");

            if (string.Equals(
                renta.Estado,
                "Concluida",
                StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("Esta renta ya fue concluida anteriormente.");
            }

            renta.Estado = "Concluida";
            renta.FechaDevolucion = DateTime.Now;
            renta.Total = renta.MontoXdia * renta.CantidadDias;

            var vehiculo = await _context.Vehiculos.FindAsync(renta.IdVehiculo);

            if (vehiculo != null)
            {
                /*
                 * No vuelve a Disponible.
                 * Como ya fue rentado una vez, queda fuera de futuras rentas.
                 */
                vehiculo.Estado = false;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRenta(int id)
        {
            var renta = await _context.Rentas.FindAsync(id);

            if (renta == null)
                return NotFound("La renta seleccionada no existe.");

            return BadRequest(
                "Las rentas no pueden eliminarse porque forman parte del historial del vehículo."
            );
        }
    }
}