using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientesController : ControllerBase
    {
        private readonly RentCarDbContext _context;

        public ClientesController(RentCarDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
        {
            return await _context.Clientes.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Cliente>> GetCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);

            if (cliente == null)
                return NotFound();

            return cliente;
        }

        [HttpPost]
        public async Task<ActionResult<Cliente>> PostCliente(Cliente cliente)
        {
            cliente.Cedula = LimpiarCedula(cliente.Cedula);

            if (!CedulaValida(cliente.Cedula))
                return BadRequest("La cédula ingresada no es válida.");

            var existeCedula = await _context.Clientes.AnyAsync(c => c.Cedula == cliente.Cedula);

            if (existeCedula)
                return BadRequest("Ya existe un cliente registrado con esta cédula.");

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, cliente);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCliente(int id, Cliente cliente)
        {
            if (id != cliente.Id)
                return BadRequest("El ID del cliente no coincide.");

            cliente.Cedula = LimpiarCedula(cliente.Cedula);

            if (!CedulaValida(cliente.Cedula))
                return BadRequest("La cédula ingresada no es válida.");

            var existeCliente = await _context.Clientes.AnyAsync(c => c.Id == id);

            if (!existeCliente)
                return NotFound();

            var cedulaDuplicada = await _context.Clientes.AnyAsync(c => c.Cedula == cliente.Cedula && c.Id != id);

            if (cedulaDuplicada)
                return BadRequest("Ya existe otro cliente registrado con esta cédula.");

            _context.Entry(cliente).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);

            if (cliente == null)
                return NotFound();

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private string LimpiarCedula(string cedula)
        {
            if (string.IsNullOrWhiteSpace(cedula))
                return string.Empty;

            return new string(cedula.Where(char.IsDigit).ToArray());
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