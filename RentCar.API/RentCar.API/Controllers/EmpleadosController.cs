using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EmpleadosController : ControllerBase
    {
        private readonly RentCarDbContext _context;

        public EmpleadosController(RentCarDbContext context)
        {
            _context = context;
        }

        // Método para OBTENER la lista (GET)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Empleado>>> GetEmpleados()
        {
            return await _context.Empleados.ToListAsync();
        }

        // Método para CREAR (POST) CON VALIDACIÓN DE CÉDULA
        [HttpPost]
        public async Task<ActionResult<Empleado>> PostEmpleado(Empleado empleado)
        {
            // 1. Validar que la cédula no se repita en la base de datos
            var cedulaExiste = await _context.Empleados.AnyAsync(e => e.Cedula == empleado.Cedula);

            if (cedulaExiste)
            {
                // Si ya existe, rechazamos la petición con un error 400
                return BadRequest("Ya existe un empleado registrado con esta cédula.");
            }

            // 2. Si la cédula es nueva, guardamos el empleado normalmente
            _context.Empleados.Add(empleado);
            await _context.SaveChangesAsync();
            return CreatedAtAction("GetEmpleados", new { id = empleado.Id }, empleado);
        }

        // Método para ELIMINAR (DELETE)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmpleado(int id)
        {
            // 1. Busca si el empleado existe en la base de datos
            var empleado = await _context.Empleados.FindAsync(id);

            if (empleado == null)
            {
                // Si alguien intenta borrar un ID que no existe, devuelve 404
                return NotFound();
            }

            // 2. Si lo encuentra, lo elimina de la memoria
            _context.Empleados.Remove(empleado);

            // 3. Guarda los cambios permanentemente en la base de datos
            await _context.SaveChangesAsync();

            // 4. Le responde a Angular que todo salió perfecto (204)
            return NoContent();
        }
    }
}