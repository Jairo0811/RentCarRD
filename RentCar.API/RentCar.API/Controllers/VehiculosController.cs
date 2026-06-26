using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehiculosController : ControllerBase
    {
        private readonly RentCarDbContext _context;

        public VehiculosController(RentCarDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehiculo>>> GetVehiculos()
        {
            return await _context.Vehiculos.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Vehiculo>> GetVehiculo(int id)
        {
            var vehiculo = await _context.Vehiculos.FindAsync(id);

            if (vehiculo == null)
                return NotFound();

            return vehiculo;
        }

        [HttpPost]
        public async Task<ActionResult<Vehiculo>> PostVehiculo(Vehiculo vehiculo)
        {
            if (vehiculo.IdMarca == null || vehiculo.IdMarca == 0)
                vehiculo.IdMarca = 1;

            if (vehiculo.IdModelo == null || vehiculo.IdModelo == 0)
                vehiculo.IdModelo = 1;

            if (vehiculo.IdTipoVehiculo == null || vehiculo.IdTipoVehiculo == 0)
                vehiculo.IdTipoVehiculo = 1;

            if (vehiculo.IdTipoCombustible == null || vehiculo.IdTipoCombustible == 0)
                vehiculo.IdTipoCombustible = 1;

            if (vehiculo.Estado == null)
                vehiculo.Estado = true;

            _context.Vehiculos.Add(vehiculo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVehiculo), new { id = vehiculo.Id }, vehiculo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehiculo(int id, Vehiculo vehiculo)
        {
            if (id != vehiculo.Id)
                return BadRequest("El ID del vehículo no coincide.");

            var existeVehiculo = await _context.Vehiculos.AnyAsync(v => v.Id == id);

            if (!existeVehiculo)
                return NotFound();

            if (vehiculo.IdMarca == null || vehiculo.IdMarca == 0)
                vehiculo.IdMarca = 1;

            if (vehiculo.IdModelo == null || vehiculo.IdModelo == 0)
                vehiculo.IdModelo = 1;

            if (vehiculo.IdTipoVehiculo == null || vehiculo.IdTipoVehiculo == 0)
                vehiculo.IdTipoVehiculo = 1;

            if (vehiculo.IdTipoCombustible == null || vehiculo.IdTipoCombustible == 0)
                vehiculo.IdTipoCombustible = 1;

            if (vehiculo.Estado == null)
                vehiculo.Estado = true;

            _context.Entry(vehiculo).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVehiculo(int id)
        {
            var vehiculo = await _context.Vehiculos.FindAsync(id);

            if (vehiculo == null)
                return NotFound();

            _context.Vehiculos.Remove(vehiculo);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}