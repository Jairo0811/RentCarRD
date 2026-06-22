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

        [HttpPost]
        public async Task<ActionResult<Renta>> PostRenta(Renta renta)
        {
            _context.Rentas.Add(renta);

            // Lógica de negocio: Al rentar un vehículo, cambiar su estado a No Disponible (false)
            var vehiculo = await _context.Vehiculos.FindAsync(renta.IdVehiculo);
            if (vehiculo != null)
            {
                vehiculo.Estado = false;
            }

            await _context.SaveChangesAsync();
            return CreatedAtAction("GetRentas", new { id = renta.NoRenta }, renta);
        }

        [HttpPut("{id}/devolucion")]
        public async Task<IActionResult> DevolverVehiculo(int id)
        {
            var renta = await _context.Rentas.FindAsync(id);
            if (renta == null) return NotFound();

            renta.Estado = "Concluida";
            renta.FechaDevolucion = DateTime.Now;

            // Liberar el vehículo
            var vehiculo = await _context.Vehiculos.FindAsync(renta.IdVehiculo);
            if (vehiculo != null) vehiculo.Estado = true;

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}