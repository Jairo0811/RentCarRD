using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InspeccionesController : ControllerBase
    {
        private readonly RentCarDbContext _context;

        public InspeccionesController(RentCarDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Inspeccione>>> GetInspecciones()
        {
            return await _context.Inspecciones.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Inspeccione>> GetInspeccion(int id)
        {
            var inspeccion = await _context.Inspecciones.FindAsync(id);

            if (inspeccion == null)
                return NotFound();

            return inspeccion;
        }

        [HttpPost]
        public async Task<ActionResult<Inspeccione>> PostInspeccion(Inspeccione inspeccion)
        {
            _context.Inspecciones.Add(inspeccion);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInspeccion), new { id = inspeccion.IdTransaccion }, inspeccion);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutInspeccion(int id, Inspeccione inspeccion)
        {
            if (id != inspeccion.IdTransaccion)
                return BadRequest("El ID de la inspección no coincide.");

            var existeInspeccion = await _context.Inspecciones.AnyAsync(i => i.IdTransaccion == id);

            if (!existeInspeccion)
                return NotFound();

            _context.Entry(inspeccion).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInspeccion(int id)
        {
            var inspeccion = await _context.Inspecciones.FindAsync(id);

            if (inspeccion == null)
                return NotFound();

            _context.Inspecciones.Remove(inspeccion);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}