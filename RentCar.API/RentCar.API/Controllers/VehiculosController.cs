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
        private readonly IWebHostEnvironment _environment;

        public VehiculosController(RentCarDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
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
            NormalizarVehiculo(vehiculo);

            _context.Vehiculos.Add(vehiculo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetVehiculo), new { id = vehiculo.Id }, vehiculo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutVehiculo(int id, Vehiculo vehiculo)
        {
            if (id != vehiculo.Id)
                return BadRequest("El ID del vehículo no coincide.");

            var vehiculoActual = await _context.Vehiculos.AsNoTracking().FirstOrDefaultAsync(v => v.Id == id);

            if (vehiculoActual == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(vehiculo.ImagenUrl))
                vehiculo.ImagenUrl = vehiculoActual.ImagenUrl;

            NormalizarVehiculo(vehiculo);

            _context.Entry(vehiculo).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id}/imagen")]
        public async Task<IActionResult> SubirImagen(int id, IFormFile imagen)
        {
            var vehiculo = await _context.Vehiculos.FindAsync(id);

            if (vehiculo == null)
                return NotFound("Vehículo no encontrado.");

            if (imagen == null || imagen.Length == 0)
                return BadRequest("No se recibió ninguna imagen.");

            var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(imagen.FileName).ToLower();

            if (!extensionesPermitidas.Contains(extension))
                return BadRequest("Formato no permitido. Usa JPG, JPEG, PNG o WEBP.");

            var carpeta = Path.Combine(_environment.WebRootPath, "vehiculos");

            if (!Directory.Exists(carpeta))
                Directory.CreateDirectory(carpeta);

            var nombreArchivo = $"{Guid.NewGuid()}{extension}";
            var rutaArchivo = Path.Combine(carpeta, nombreArchivo);

            using (var stream = new FileStream(rutaArchivo, FileMode.Create))
            {
                await imagen.CopyToAsync(stream);
            }

            vehiculo.ImagenUrl = $"/vehiculos/{nombreArchivo}";
            await _context.SaveChangesAsync();

            return Ok(new { imagenUrl = vehiculo.ImagenUrl });
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

        private void NormalizarVehiculo(Vehiculo vehiculo)
        {
            if (vehiculo.IdMarca == null || vehiculo.IdMarca == 0)
                vehiculo.IdMarca = 1;

            if (vehiculo.IdModelo == null || vehiculo.IdModelo == 0)
                vehiculo.IdModelo = 1;

            if (vehiculo.IdTipoVehiculo == null || vehiculo.IdTipoVehiculo == 0)
                vehiculo.IdTipoVehiculo = 1;

            if (vehiculo.IdTipoCombustible == null || vehiculo.IdTipoCombustible == 0)
                vehiculo.IdTipoCombustible = 1;

            if (vehiculo.IdCombustible == null || vehiculo.IdCombustible == 0)
                vehiculo.IdCombustible = 1;

            if (vehiculo.Estado == null)
                vehiculo.Estado = true;
        }
    }
}