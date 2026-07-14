using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VehiculosController : ControllerBase
    {
        private const string EstadoDisponible = "Disponible";
        private const string EstadoRentado = "Rentado";
        private const string EstadoNoDisponible = "NoDisponible";

        private readonly RentCarDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public VehiculosController(
            RentCarDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Vehiculo>>> GetVehiculos()
        {
            var vehiculos = await _context.Vehiculos
                .AsNoTracking()
                .OrderByDescending(v => v.Id)
                .ToListAsync();

            return Ok(vehiculos);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Vehiculo>> GetVehiculo(int id)
        {
            var vehiculo = await _context.Vehiculos
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.Id == id);

            if (vehiculo == null)
                return NotFound("El vehículo solicitado no existe.");

            return Ok(vehiculo);
        }

        [HttpPost]
        public async Task<ActionResult<Vehiculo>> PostVehiculo(Vehiculo vehiculo)
        {
            NormalizarVehiculo(vehiculo);

            var errorValidacion = ValidarVehiculo(vehiculo);

            if (errorValidacion != null)
                return BadRequest(errorValidacion);

            var placaDuplicada = await _context.Vehiculos.AnyAsync(v =>
                v.NoPlaca == vehiculo.NoPlaca);

            if (placaDuplicada)
                return BadRequest("Ya existe un vehículo registrado con esta placa.");

            if (!string.IsNullOrWhiteSpace(vehiculo.NoChasis))
            {
                var chasisDuplicado = await _context.Vehiculos.AnyAsync(v =>
                    v.NoChasis == vehiculo.NoChasis);

                if (chasisDuplicado)
                {
                    return BadRequest(
                        "Ya existe un vehículo registrado con este número de chasis.");
                }
            }

            _context.Vehiculos.Add(vehiculo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetVehiculo),
                new { id = vehiculo.Id },
                vehiculo);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutVehiculo(
            int id,
            Vehiculo vehiculo)
        {
            if (id != vehiculo.Id)
                return BadRequest("El ID del vehículo no coincide.");

            var vehiculoActual = await _context.Vehiculos
                .FirstOrDefaultAsync(v => v.Id == id);

            if (vehiculoActual == null)
                return NotFound("El vehículo solicitado no existe.");

            NormalizarVehiculo(vehiculo);

            var errorValidacion = ValidarVehiculo(vehiculo);

            if (errorValidacion != null)
                return BadRequest(errorValidacion);

            var placaDuplicada = await _context.Vehiculos.AnyAsync(v =>
                v.NoPlaca == vehiculo.NoPlaca &&
                v.Id != id);

            if (placaDuplicada)
                return BadRequest("Ya existe otro vehículo registrado con esta placa.");

            if (!string.IsNullOrWhiteSpace(vehiculo.NoChasis))
            {
                var chasisDuplicado = await _context.Vehiculos.AnyAsync(v =>
                    v.NoChasis == vehiculo.NoChasis &&
                    v.Id != id);

                if (chasisDuplicado)
                {
                    return BadRequest(
                        "Ya existe otro vehículo registrado con este número de chasis.");
                }
            }

            /*
             * No permitimos que una edición manual cambie un vehículo
             * rentado o devuelto nuevamente a Disponible.
             */
            if (
                string.Equals(
                    vehiculoActual.EstadoOperacion,
                    EstadoRentado,
                    StringComparison.OrdinalIgnoreCase) ||
                string.Equals(
                    vehiculoActual.EstadoOperacion,
                    EstadoNoDisponible,
                    StringComparison.OrdinalIgnoreCase))
            {
                vehiculo.EstadoOperacion = vehiculoActual.EstadoOperacion;
                vehiculo.Estado = false;
            }

            vehiculoActual.Descripcion = vehiculo.Descripcion;
            vehiculoActual.NoPlaca = vehiculo.NoPlaca;
            vehiculoActual.NoChasis = vehiculo.NoChasis;
            vehiculoActual.NoMotor = vehiculo.NoMotor;
            vehiculoActual.IdMarca = vehiculo.IdMarca;
            vehiculoActual.IdModelo = vehiculo.IdModelo;
            vehiculoActual.IdTipoVehiculo = vehiculo.IdTipoVehiculo;
            vehiculoActual.IdTipoCombustible = vehiculo.IdTipoCombustible;
            vehiculoActual.IdCombustible = vehiculo.IdCombustible;
            vehiculoActual.Estado = vehiculo.Estado;
            vehiculoActual.EstadoOperacion = vehiculo.EstadoOperacion;

            if (!string.IsNullOrWhiteSpace(vehiculo.ImagenUrl))
            {
                vehiculoActual.ImagenUrl = vehiculo.ImagenUrl;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPost("{id:int}/imagen")]
        public async Task<IActionResult> SubirImagen(
            int id,
            IFormFile imagen)
        {
            var vehiculo = await _context.Vehiculos.FindAsync(id);

            if (vehiculo == null)
                return NotFound("Vehículo no encontrado.");

            if (imagen == null || imagen.Length == 0)
                return BadRequest("No se recibió ninguna imagen.");

            const long tamanoMaximo = 5 * 1024 * 1024;

            if (imagen.Length > tamanoMaximo)
            {
                return BadRequest(
                    "La imagen no puede superar los 5 MB.");
            }

            var extensionesPermitidas = new[]
            {
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            };

            var extension = Path
                .GetExtension(imagen.FileName)
                .ToLowerInvariant();

            if (!extensionesPermitidas.Contains(extension))
            {
                return BadRequest(
                    "Formato no permitido. Usa JPG, JPEG, PNG o WEBP.");
            }

            var webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot");
            }

            var carpeta = Path.Combine(
                webRootPath,
                "vehiculos");

            Directory.CreateDirectory(carpeta);

            var nombreArchivo = $"{Guid.NewGuid():N}{extension}";
            var rutaArchivo = Path.Combine(
                carpeta,
                nombreArchivo);

            await using (var stream = new FileStream(
                rutaArchivo,
                FileMode.Create))
            {
                await imagen.CopyToAsync(stream);
            }

            EliminarImagenAnterior(
                vehiculo.ImagenUrl,
                webRootPath,
                nombreArchivo);

            vehiculo.ImagenUrl =
                $"/vehiculos/{nombreArchivo}";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                vehiculo.Id,
                vehiculo.ImagenUrl
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteVehiculo(int id)
        {
            var vehiculo = await _context.Vehiculos.FindAsync(id);

            if (vehiculo == null)
                return NotFound("El vehículo solicitado no existe.");

            var tieneRentas = await _context.Rentas
                .AnyAsync(r => r.IdVehiculo == id);

            if (tieneRentas)
            {
                return BadRequest(
                    "No se puede eliminar el vehículo porque tiene rentas registradas.");
            }

            var tieneInspecciones = await _context.Inspecciones
                .AnyAsync(i => i.IdVehiculo == id);

            if (tieneInspecciones)
            {
                return BadRequest(
                    "No se puede eliminar el vehículo porque tiene inspecciones registradas.");
            }

            var webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "wwwroot");
            }

            EliminarImagenAnterior(
                vehiculo.ImagenUrl,
                webRootPath);

            _context.Vehiculos.Remove(vehiculo);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static void NormalizarVehiculo(Vehiculo vehiculo)
        {
            vehiculo.Descripcion =
                vehiculo.Descripcion?.Trim();

            vehiculo.NoPlaca =
                LimpiarAlfanumerico(vehiculo.NoPlaca);

            vehiculo.NoChasis =
                LimpiarAlfanumerico(vehiculo.NoChasis);

            vehiculo.NoMotor =
                LimpiarAlfanumerico(vehiculo.NoMotor);

            if (
                vehiculo.IdTipoCombustible == null ||
                vehiculo.IdTipoCombustible <= 0)
            {
                vehiculo.IdTipoCombustible =
                    vehiculo.IdCombustible;
            }

            if (
                vehiculo.IdCombustible == null ||
                vehiculo.IdCombustible <= 0)
            {
                vehiculo.IdCombustible =
                    vehiculo.IdTipoCombustible;
            }

            vehiculo.EstadoOperacion =
                NormalizarEstadoOperacion(
                    vehiculo.EstadoOperacion,
                    vehiculo.Estado);

            vehiculo.Estado =
                vehiculo.EstadoOperacion == EstadoDisponible;
        }

        private static string? ValidarVehiculo(Vehiculo vehiculo)
        {
            if (string.IsNullOrWhiteSpace(vehiculo.Descripcion))
                return "La descripción del vehículo es obligatoria.";

            if (vehiculo.IdMarca == null || vehiculo.IdMarca <= 0)
                return "Debe seleccionar una marca válida.";

            if (vehiculo.IdModelo == null || vehiculo.IdModelo <= 0)
                return "Debe seleccionar un modelo válido.";

            if (
                vehiculo.IdTipoVehiculo == null ||
                vehiculo.IdTipoVehiculo <= 0)
            {
                return "Debe seleccionar un tipo de vehículo válido.";
            }

            if (
                vehiculo.IdTipoCombustible == null ||
                vehiculo.IdTipoCombustible <= 0)
            {
                return "Debe seleccionar un tipo de combustible válido.";
            }

            if (string.IsNullOrWhiteSpace(vehiculo.NoPlaca))
                return "El número de placa es obligatorio.";

            if (!Regex.IsMatch(
                vehiculo.NoPlaca,
                @"^[A-Z0-9]{6,7}$"))
            {
                return "La placa debe contener entre 6 y 7 caracteres alfanuméricos.";
            }

            if (!string.IsNullOrWhiteSpace(vehiculo.NoChasis))
            {
                if (!Regex.IsMatch(
                    vehiculo.NoChasis,
                    @"^[A-Z0-9]{1,17}$"))
                {
                    return "El chasis debe contener únicamente letras y números, con un máximo de 17 caracteres.";
                }
            }

            if (!string.IsNullOrWhiteSpace(vehiculo.NoMotor))
            {
                if (!Regex.IsMatch(
                    vehiculo.NoMotor,
                    @"^[A-Z0-9]+$"))
                {
                    return "El número de motor debe contener únicamente letras y números.";
                }
            }

            var estadosPermitidos = new[]
            {
                EstadoDisponible,
                EstadoRentado,
                EstadoNoDisponible
            };

            if (!estadosPermitidos.Contains(
                vehiculo.EstadoOperacion))
            {
                return "El estado operativo del vehículo no es válido.";
            }

            return null;
        }

        private static string NormalizarEstadoOperacion(
            string? estadoOperacion,
            bool? estadoAnterior)
        {
            if (string.Equals(
                estadoOperacion,
                EstadoRentado,
                StringComparison.OrdinalIgnoreCase))
            {
                return EstadoRentado;
            }

            if (
                string.Equals(
                    estadoOperacion,
                    EstadoNoDisponible,
                    StringComparison.OrdinalIgnoreCase) ||
                string.Equals(
                    estadoOperacion,
                    "No Disponible",
                    StringComparison.OrdinalIgnoreCase))
            {
                return EstadoNoDisponible;
            }

            if (string.Equals(
                estadoOperacion,
                EstadoDisponible,
                StringComparison.OrdinalIgnoreCase))
            {
                return EstadoDisponible;
            }

            return estadoAnterior == false
                ? EstadoRentado
                : EstadoDisponible;
        }

        private static string? LimpiarAlfanumerico(
            string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return null;

            return new string(
                valor
                    .ToUpperInvariant()
                    .Where(char.IsLetterOrDigit)
                    .ToArray());
        }

        private static void EliminarImagenAnterior(
            string? imagenUrl,
            string webRootPath,
            string? nuevaImagen = null)
        {
            if (string.IsNullOrWhiteSpace(imagenUrl))
                return;

            var nombreAnterior = Path.GetFileName(imagenUrl);

            if (
                !string.IsNullOrWhiteSpace(nuevaImagen) &&
                string.Equals(
                    nombreAnterior,
                    nuevaImagen,
                    StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            var rutaAnterior = Path.Combine(
                webRootPath,
                "vehiculos",
                nombreAnterior);

            if (System.IO.File.Exists(rutaAnterior))
            {
                System.IO.File.Delete(rutaAnterior);
            }
        }
    }
}