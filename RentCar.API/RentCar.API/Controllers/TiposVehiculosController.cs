using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;
using RentCar.API.Security;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = AppRoles.Operaciones)]
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
        [Authorize(Roles = AppRoles.Administrador)]
        public async Task<ActionResult<TiposVehiculo>> PostTipoVehiculo(TiposVehiculo tipoVehiculo)
        {
            _context.TiposVehiculos.Add(tipoVehiculo);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetTiposVehiculos", new { id = tipoVehiculo.Id }, tipoVehiculo);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = AppRoles.Administrador)]
        public async Task<IActionResult> PutTipoVehiculo(int id, TiposVehiculo tipoVehiculo)
        {
            if (id != tipoVehiculo.Id) return BadRequest();
            _context.Entry(tipoVehiculo).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = AppRoles.Administrador)]
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
