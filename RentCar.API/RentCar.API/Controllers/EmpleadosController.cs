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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Empleado>>> GetEmpleados()
        {
            return await _context.Empleados.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Empleado>> GetEmpleado(int id)
        {
            var empleado = await _context.Empleados.FindAsync(id);

            if (empleado == null)
                return NotFound();

            return empleado;
        }

        [HttpGet("validar-cedula/{cedula}")]
        public async Task<IActionResult> ValidarCedula(string cedula, int? idEmpleado = null)
        {
            var cedulaLimpia = LimpiarCedula(cedula);
            var esValida = CedulaValida(cedulaLimpia);

            var empleadoExistente = await _context.Empleados.FirstOrDefaultAsync(e =>
                e.Cedula == cedulaLimpia &&
                (!idEmpleado.HasValue || e.Id != idEmpleado.Value)
            );

            var existe = empleadoExistente != null;

            return Ok(new
            {
                cedula = cedulaLimpia,
                cedulaFormateada = FormatearCedula(cedulaLimpia),
                esValida = esValida && !existe,
                existe,
                nombreEmpleado = empleadoExistente?.Nombre,
                fuente = "Validador local",
                mensaje = !esValida
                    ? "La cédula ingresada no es válida."
                    : existe
                        ? $"Esta cédula ya pertenece al empleado {empleadoExistente!.Nombre}."
                        : "Cédula válida y disponible para registrar."
            });
        }

        [HttpPost]
        public async Task<ActionResult<Empleado>> PostEmpleado(Empleado empleado)
        {
            empleado.Cedula = LimpiarCedula(empleado.Cedula);

            if (!CedulaValida(empleado.Cedula))
                return BadRequest("La cédula ingresada no es válida.");

            var cedulaExiste = await _context.Empleados.AnyAsync(e => e.Cedula == empleado.Cedula);

            if (cedulaExiste)
                return BadRequest("Ya existe un empleado registrado con esta cédula.");

            if (string.IsNullOrWhiteSpace(empleado.Nombre))
                return BadRequest("El nombre del empleado es obligatorio.");

            if (string.IsNullOrWhiteSpace(empleado.Usuario))
                return BadRequest("El usuario de acceso es obligatorio.");

            if (empleado.PorcientoComision < 0)
                return BadRequest("El porcentaje de comisión no puede ser negativo.");

            _context.Empleados.Add(empleado);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEmpleado), new { id = empleado.Id }, empleado);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutEmpleado(int id, Empleado empleado)
        {
            if (id != empleado.Id)
                return BadRequest("El ID del empleado no coincide.");

            empleado.Cedula = LimpiarCedula(empleado.Cedula);

            if (!CedulaValida(empleado.Cedula))
                return BadRequest("La cédula ingresada no es válida.");

            if (string.IsNullOrWhiteSpace(empleado.Nombre))
                return BadRequest("El nombre del empleado es obligatorio.");

            if (string.IsNullOrWhiteSpace(empleado.Usuario))
                return BadRequest("El usuario de acceso es obligatorio.");

            if (empleado.PorcientoComision < 0)
                return BadRequest("El porcentaje de comisión no puede ser negativo.");

            var existeEmpleado = await _context.Empleados.AnyAsync(e => e.Id == id);

            if (!existeEmpleado)
                return NotFound();

            var cedulaDuplicada = await _context.Empleados.AnyAsync(e =>
                e.Cedula == empleado.Cedula && e.Id != id
            );

            if (cedulaDuplicada)
                return BadRequest("Ya existe otro empleado registrado con esta cédula.");

            var usuarioDuplicado = await _context.Empleados.AnyAsync(e =>
                e.Usuario == empleado.Usuario && e.Id != id
            );

            if (usuarioDuplicado)
                return BadRequest("Ya existe otro empleado registrado con este usuario.");

            _context.Entry(empleado).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmpleado(int id)
        {
            var empleado = await _context.Empleados.FindAsync(id);

            if (empleado == null)
                return NotFound();

            _context.Empleados.Remove(empleado);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private string LimpiarCedula(string cedula)
        {
            if (string.IsNullOrWhiteSpace(cedula))
                return string.Empty;

            return new string(cedula.Where(char.IsDigit).ToArray());
        }

        private string FormatearCedula(string cedula)
        {
            cedula = LimpiarCedula(cedula);

            if (cedula.Length != 11)
                return cedula;

            return $"{cedula[..3]}-{cedula.Substring(3, 7)}-{cedula[10]}";
        }

        private bool CedulaValida(string cedula)
        {
            cedula = LimpiarCedula(cedula);

            if (cedula.Length != 11)
                return false;

            if (cedula.All(c => c == cedula[0]))
                return false;

            int[] pesos = { 1, 2, 1, 2, 1, 2, 1, 2, 1, 2 };
            int suma = 0;

            for (int i = 0; i < 10; i++)
            {
                int valor = (cedula[i] - '0') * pesos[i];

                if (valor >= 10)
                    valor = (valor / 10) + (valor % 10);

                suma += valor;
            }

            int digitoVerificador = (10 - (suma % 10)) % 10;

            return digitoVerificador == (cedula[10] - '0');
        }
    }
}