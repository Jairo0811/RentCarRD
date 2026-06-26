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
        public async Task<ActionResult<Renta>> PostRenta(Renta renta)
        {
            renta.Total = renta.MontoXdia * renta.CantidadDias;
            renta.Estado = "Activa";

            _context.Rentas.Add(renta);

            var vehiculo = await _context.Vehiculos.FindAsync(renta.IdVehiculo);
            if (vehiculo != null)
                vehiculo.Estado = false;

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRenta), new { id = renta.NoRenta }, renta);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutRenta(int id, Renta renta)
        {
            if (id != renta.NoRenta)
                return BadRequest("El ID de la renta no coincide.");

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
                return NotFound();

            renta.Estado = "Concluida";
            renta.FechaDevolucion = DateTime.Now;

            if (renta.MontoXdia != null && renta.CantidadDias != null)
                renta.Total = renta.MontoXdia * renta.CantidadDias;

            var vehiculo = await _context.Vehiculos.FindAsync(renta.IdVehiculo);

            if (vehiculo != null)
                vehiculo.Estado = true;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRenta(int id)
        {
            var renta = await _context.Rentas.FindAsync(id);

            if (renta == null)
                return NotFound();

            var vehiculo = await _context.Vehiculos.FindAsync(renta.IdVehiculo);

            if (vehiculo != null)
                vehiculo.Estado = true;

            _context.Rentas.Remove(renta);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}