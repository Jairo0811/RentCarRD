using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MarcasController : ControllerBase
    {
        private readonly RentCarDbContext _context;

        public MarcasController(RentCarDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Marca>>> GetMarcas()
        {
            return await _context.Marcas.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Marca>> PostMarca(Marca marca)
        {
            _context.Marcas.Add(marca);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetMarcas", new { id = marca.Id }, marca);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutMarca(int id, Marca marca)
        {
            if (id != marca.Id) return BadRequest();
            _context.Entry(marca).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMarca(int id)
        {
            var marca = await _context.Marcas.FindAsync(id);
            if (marca == null) return NotFound();
            _context.Marcas.Remove(marca);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}