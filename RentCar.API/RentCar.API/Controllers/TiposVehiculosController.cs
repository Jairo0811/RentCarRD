using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TiposVehiculosController : ControllerBase
    {
        private readonly RentCarDbContext _context;

        public TiposVehiculosController(RentCarDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TiposVehiculo>>> GetTiposVehiculos()
        {
            return await _context.TiposVehiculos.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<TiposVehiculo>> PostTipoVehiculo(TiposVehiculo tipoVehiculo)
        {
            _context.TiposVehiculos.Add(tipoVehiculo);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetTiposVehiculos", new { id = tipoVehiculo.Id }, tipoVehiculo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutTipoVehiculo(int id, TiposVehiculo tipoVehiculo)
        {
            if (id != tipoVehiculo.Id) return BadRequest();
            _context.Entry(tipoVehiculo).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTipoVehiculo(int id)
        {
            var tipoVehiculo = await _context.TiposVehiculos.FindAsync(id);
            if (tipoVehiculo == null) return NotFound();
            _context.TiposVehiculos.Remove(tipoVehiculo);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}