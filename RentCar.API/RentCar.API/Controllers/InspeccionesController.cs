using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;
using RentCar.API.Security;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = AppRoles.Administrador)]
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
            if (!int.TryParse(
                    User.FindFirstValue(ClaimTypes.NameIdentifier),
                    out var currentEmployeeId))
            {
                return Unauthorized();
            }

            inspeccion.IdEmpleadoInspeccion = currentEmployeeId;
            _context.Inspecciones.Add(inspeccion);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInspeccion), new { id = inspeccion.IdTransaccion }, inspeccion);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutInspeccion(int id, Inspeccione inspeccion)
        {
            if (id != inspeccion.IdTransaccion)
                return BadRequest("El ID de la inspección no coincide.");

            var current = await _context.Inspecciones
                .FirstOrDefaultAsync(i => i.IdTransaccion == id);

            if (current is null)
                return NotFound();

            current.IdVehiculo = inspeccion.IdVehiculo;
            current.IdCliente = inspeccion.IdCliente;
            current.TieneRalladuras = inspeccion.TieneRalladuras;
            current.CantidadCombustible = inspeccion.CantidadCombustible;
            current.TieneGomaRespuesta = inspeccion.TieneGomaRespuesta;
            current.TieneGato = inspeccion.TieneGato;
            current.TieneRoturasCristal = inspeccion.TieneRoturasCristal;
            current.GomaDelanteraDerecha = inspeccion.GomaDelanteraDerecha;
            current.GomaDelanteraIzquierda = inspeccion.GomaDelanteraIzquierda;
            current.GomaTraseraDerecha = inspeccion.GomaTraseraDerecha;
            current.GomaTraseraIzquierda = inspeccion.GomaTraseraIzquierda;
            current.Fecha = inspeccion.Fecha;
            current.Estado = inspeccion.Estado;
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
