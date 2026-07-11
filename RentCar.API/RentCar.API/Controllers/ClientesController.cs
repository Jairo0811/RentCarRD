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
                return NotFound("El cliente solicitado no existe.");

            return cliente;
        }

        [HttpGet("validar-cedula/{cedula}")]
        public async Task<IActionResult> ValidarCedula(
            string cedula,
            int? idCliente = null)
        {
            var cedulaLimpia = LimpiarCedula(cedula);
            var esValida = CedulaValida(cedulaLimpia);

            var clienteExistente = await _context.Clientes
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.Cedula == cedulaLimpia &&
                    (!idCliente.HasValue || c.Id != idCliente.Value));

            var existe = clienteExistente != null;

            return Ok(new
            {
                cedula = cedulaLimpia,
                cedulaFormateada = FormatearCedula(cedulaLimpia),
                esValida = esValida && !existe,
                existe,
                nombreCliente = clienteExistente?.Nombre,
                fuente = "Validador local",
                mensaje = !esValida
                    ? "La cédula ingresada no es válida."
                    : existe
                        ? $"Esta cédula ya pertenece a {clienteExistente!.Nombre}."
                        : "Cédula válida y disponible para registrar."
            });
        }

        [HttpPost]
        public async Task<ActionResult<Cliente>> PostCliente(Cliente cliente)
        {
            NormalizarCliente(cliente);

            var errorValidacion = ValidarCliente(cliente);

            if (errorValidacion != null)
                return BadRequest(errorValidacion);

            var cedulaDuplicada = await _context.Clientes
                .AnyAsync(c => c.Cedula == cliente.Cedula);

            if (cedulaDuplicada)
                return BadRequest("Ya existe un cliente registrado con esta cédula.");

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetCliente),
                new { id = cliente.Id },
                cliente);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutCliente(int id, Cliente cliente)
        {
            if (id != cliente.Id)
                return BadRequest("El ID del cliente no coincide.");

            var clienteExistente = await _context.Clientes.FindAsync(id);

            if (clienteExistente == null)
                return NotFound("El cliente solicitado no existe.");

            NormalizarCliente(cliente);

            var errorValidacion = ValidarCliente(cliente);

            if (errorValidacion != null)
                return BadRequest(errorValidacion);

            var cedulaDuplicada = await _context.Clientes.AnyAsync(c =>
                c.Cedula == cliente.Cedula &&
                c.Id != id);

            if (cedulaDuplicada)
                return BadRequest("Ya existe otro cliente registrado con esta cédula.");

            clienteExistente.Nombre = cliente.Nombre;
            clienteExistente.Cedula = cliente.Cedula;
            clienteExistente.LimiteCredito = cliente.LimiteCredito;
            clienteExistente.Estado = cliente.Estado;
            clienteExistente.TipoPersona = cliente.TipoPersona;
            clienteExistente.NoTarjetaCr = cliente.NoTarjetaCr;
            clienteExistente.NombreTitularTarjeta = cliente.NombreTitularTarjeta;
            clienteExistente.FechaExpiracionTarjeta = cliente.FechaExpiracionTarjeta;
            clienteExistente.TipoTarjeta = cliente.TipoTarjeta;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);

            if (cliente == null)
                return NotFound("El cliente solicitado no existe.");

            var tieneRentas = await _context.Rentas
                .AnyAsync(r => r.IdCliente == id);

            if (tieneRentas)
            {
                return BadRequest(
                    "No se puede eliminar el cliente porque tiene rentas registradas.");
            }

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private void NormalizarCliente(Cliente cliente)
        {
            cliente.Nombre = (cliente.Nombre ?? string.Empty).Trim();
            cliente.Cedula = LimpiarCedula(cliente.Cedula);
            cliente.TipoPersona = NormalizarTipoPersona(cliente.TipoPersona);

            cliente.NombreTitularTarjeta =
                LimpiarTextoOpcional(cliente.NombreTitularTarjeta);

            cliente.FechaExpiracionTarjeta =
                LimpiarTextoOpcional(cliente.FechaExpiracionTarjeta);

            cliente.NoTarjetaCr =
                LimpiarNumeroTarjeta(cliente.NoTarjetaCr);

            cliente.TipoTarjeta =
                DetectarTipoTarjeta(cliente.NoTarjetaCr);
        }

        private string? ValidarCliente(Cliente cliente)
        {
            if (string.IsNullOrWhiteSpace(cliente.Nombre))
                return "El nombre completo del cliente es obligatorio.";

            if (!CedulaValida(cliente.Cedula))
                return "La cédula ingresada no es válida.";

            if (cliente.LimiteCredito < 0)
                return "El límite de crédito no puede ser negativo.";

            var tieneDatosTarjeta =
                !string.IsNullOrWhiteSpace(cliente.NoTarjetaCr) ||
                !string.IsNullOrWhiteSpace(cliente.NombreTitularTarjeta) ||
                !string.IsNullOrWhiteSpace(cliente.FechaExpiracionTarjeta);

            if (!tieneDatosTarjeta)
            {
                cliente.NoTarjetaCr = null;
                cliente.NombreTitularTarjeta = null;
                cliente.FechaExpiracionTarjeta = null;
                cliente.TipoTarjeta = null;

                return null;
            }

            if (string.IsNullOrWhiteSpace(cliente.NombreTitularTarjeta))
                return "El nombre del titular de la tarjeta es obligatorio.";

            if (string.IsNullOrWhiteSpace(cliente.NoTarjetaCr))
                return "El número de tarjeta es obligatorio.";

            if (!NumeroTarjetaValido(cliente.NoTarjetaCr))
                return "El número de tarjeta no es válido.";

            if (string.IsNullOrWhiteSpace(cliente.TipoTarjeta))
                return "La franquicia de la tarjeta no pudo ser identificada.";

            if (!FechaExpiracionValida(cliente.FechaExpiracionTarjeta))
                return "La fecha de expiración no es válida o la tarjeta está vencida.";

            return null;
        }

        private string LimpiarCedula(string? cedula)
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
            var suma = 0;

            for (var i = 0; i < 10; i++)
            {
                var valor = (cedula[i] - '0') * pesos[i];

                if (valor >= 10)
                    valor = (valor / 10) + (valor % 10);

                suma += valor;
            }

            var digitoVerificador = (10 - (suma % 10)) % 10;

            return digitoVerificador == (cedula[10] - '0');
        }

        private string? LimpiarTextoOpcional(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
                return null;

            return valor.Trim();
        }

        private string? LimpiarNumeroTarjeta(string? numero)
        {
            if (string.IsNullOrWhiteSpace(numero))
                return null;

            return new string(numero.Where(char.IsDigit).ToArray());
        }

        private string NormalizarTipoPersona(string? tipoPersona)
        {
            return string.Equals(
                tipoPersona,
                "Juridica",
                StringComparison.OrdinalIgnoreCase)
                    ? "Juridica"
                    : "Fisica";
        }

        private string? DetectarTipoTarjeta(string? numeroTarjeta)
        {
            var numero = LimpiarNumeroTarjeta(numeroTarjeta);

            if (string.IsNullOrWhiteSpace(numero))
                return null;

            if (numero.StartsWith("4"))
                return "VISA";

            if (EsMastercard(numero))
                return "MASTERCARD";

            if (numero.StartsWith("34") || numero.StartsWith("37"))
                return "AMEX";

            if (numero.StartsWith("6"))
                return "DISCOVER";

            return null;
        }

        private bool EsMastercard(string numero)
        {
            if (numero.Length < 2)
                return false;

            var primerosDos = int.Parse(numero[..2]);

            if (primerosDos >= 51 && primerosDos <= 55)
                return true;

            if (numero.Length < 4)
                return false;

            var primerosCuatro = int.Parse(numero[..4]);

            return primerosCuatro >= 2221 && primerosCuatro <= 2720;
        }

        private bool NumeroTarjetaValido(string numeroTarjeta)
        {
            var numero = LimpiarNumeroTarjeta(numeroTarjeta);

            if (string.IsNullOrWhiteSpace(numero))
                return false;

            var tipo = DetectarTipoTarjeta(numero);

            var longitudValida = tipo switch
            {
                "AMEX" => numero.Length == 15,
                "VISA" => numero.Length is 13 or 16 or 19,
                "MASTERCARD" => numero.Length == 16,
                "DISCOVER" => numero.Length is 16 or 19,
                _ => false
            };

            if (!longitudValida)
                return false;

            return CumpleAlgoritmoLuhn(numero);
        }

        private bool CumpleAlgoritmoLuhn(string numero)
        {
            var suma = 0;
            var duplicar = false;

            for (var i = numero.Length - 1; i >= 0; i--)
            {
                var digito = numero[i] - '0';

                if (duplicar)
                {
                    digito *= 2;

                    if (digito > 9)
                        digito -= 9;
                }

                suma += digito;
                duplicar = !duplicar;
            }

            return suma % 10 == 0;
        }

        private bool FechaExpiracionValida(string? fecha)
        {
            if (string.IsNullOrWhiteSpace(fecha))
                return false;

            if (!System.Text.RegularExpressions.Regex.IsMatch(
                fecha,
                @"^(0[1-9]|1[0-2])\/\d{2}$"))
            {
                return false;
            }

            var partes = fecha.Split('/');

            var mes = int.Parse(partes[0]);
            var anio = 2000 + int.Parse(partes[1]);

            var fechaExpiracion = new DateTime(
                anio,
                mes,
                DateTime.DaysInMonth(anio, mes),
                23,
                59,
                59);

            return fechaExpiracion >= DateTime.Now;
        }
    }
}