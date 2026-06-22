using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers // <-- ¡Aquí está el namespace!
{
    [Route("api/[controller]")]
    [ApiController]
    public class TiposCombustiblesController : ControllerBase
    {
        private readonly RentCarDbContext _context;
        public TiposCombustiblesController(RentCarDbContext context)
        {
            _context = context;
        }

        // GET: api/TiposCombustible
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TiposCombustible>>> GetTiposCombustible()
        {
            return await _context.TiposCombustibles.ToListAsync();
        }

        // GET: api/TiposCombustible/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TiposCombustible>> GetTiposCombustible(int id)
        {
            var tiposcombustible = await _context.TiposCombustibles.FindAsync(id);

            if (tiposcombustible == null)
            {
                return NotFound();
            }

            return tiposcombustible;
        }

        // PUT: api/TiposCombustible/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutTiposCombustible(int? id, TiposCombustible tiposcombustible)
        {
            if (id != tiposcombustible.Id)
            {
                return BadRequest();
            }

            _context.Entry(tiposcombustible).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TiposCombustibleExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/TiposCombustible
        [HttpPost]
        public async Task<ActionResult<TiposCombustible>> PostTiposCombustible(TiposCombustible tiposcombustible)
        {
            _context.TiposCombustibles.Add(tiposcombustible);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTiposCombustible", new { id = tiposcombustible.Id }, tiposcombustible);
        }

        // DELETE: api/TiposCombustible/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTiposCombustible(int? id)
        {
            var tiposcombustible = await _context.TiposCombustibles.FindAsync(id);
            if (tiposcombustible == null)
            {
                return NotFound();
            }

            _context.TiposCombustibles.Remove(tiposcombustible);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool TiposCombustibleExists(int? id)
        {
            return _context.TiposCombustibles.Any(e => e.Id == id);
        }
    }
}