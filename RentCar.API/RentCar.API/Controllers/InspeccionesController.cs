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

        [HttpPost]
        public async Task<ActionResult<Inspeccione>> PostInspeccion(Inspeccione inspeccion)
        {
            _context.Inspecciones.Add(inspeccion);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetInspecciones", new { id = inspeccion.IdTransaccion }, inspeccion);
        }
    }
}