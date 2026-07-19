using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;
using System.Text.RegularExpressions;

namespace RentCar.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientesController : ControllerBase
    {
        private const string PersonaFisica = "Fisica";
        private const string PersonaJuridica = "Juridica";

        private readonly RentCarDbContext _context;

        public ClientesController(RentCarDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Cliente>>> GetClientes()
        {
            return await _context.Clientes
                .AsNoTracking()
                .OrderBy(c => c.Nombre)
                .ToListAsync();
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Cliente>> GetCliente(int id)
        {
            var cliente = await _context.Clientes
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cliente == null)
            {
                return NotFound("El cliente solicitado no existe.");
            }

            return Ok(cliente);
        }

        [HttpGet("validar-documento/{documento}")]
        public async Task<IActionResult> ValidarDocumento(
            string documento,
            string tipoPersona = PersonaFisica,
            int? idCliente = null)
        {
            var tipoNormalizado = NormalizarTipoPersona(tipoPersona);
            var documentoLimpio = LimpiarDocumento(documento);
            var esValido = DocumentoValido(documentoLimpio, tipoNormalizado);

            var clienteExistente = await _context.Clientes
                .AsNoTracking()
                .FirstOrDefaultAsync(c =>
                    c.Cedula == documentoLimpio &&
                    (!idCliente.HasValue || c.Id != idCliente.Value));

            var existe = clienteExistente != null;
            var nombreDocumento = tipoNormalizado == PersonaJuridica
                ? "RNC"
                : "cédula";

            return Ok(new
            {
                documento = documentoLimpio,
                documentoFormateado = FormatearDocumento(documentoLimpio, tipoNormalizado),
                tipoPersona = tipoNormalizado,
                tipoDocumento = nombreDocumento,
                esValida = esValido && !existe,
                existe,
                nombreCliente = clienteExistente?.Nombre,
                fuente = "Validador local",
                mensaje = !esValido
                    ? $"El {nombreDocumento} ingresado no es válido."
                    : existe
                        ? $"Este {nombreDocumento} ya pertenece a {clienteExistente!.Nombre}."
                        : $"{(tipoNormalizado == PersonaJuridica ? "RNC" : "Cédula")} válido y disponible para registrar."
            });
        }

        // Se conserva para compatibilidad con versiones anteriores del frontend.
        [HttpGet("validar-cedula/{cedula}")]
        public Task<IActionResult> ValidarCedula(
            string cedula,
            int? idCliente = null)
        {
            return ValidarDocumento(cedula, PersonaFisica, idCliente);
        }

        [HttpPost]
        public async Task<ActionResult<Cliente>> PostCliente(Cliente cliente)
        {
            NormalizarCliente(cliente);

            var errorValidacion = ValidarCliente(cliente);

            if (errorValidacion != null)
            {
                return BadRequest(errorValidacion);
            }

            var documentoDuplicado = await _context.Clientes
                .AnyAsync(c => c.Cedula == cliente.Cedula);

            if (documentoDuplicado)
            {
                return BadRequest(
                    $"Ya existe un cliente registrado con este {ObtenerNombreDocumento(cliente.TipoPersona)}.");
            }

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetCliente),
                new { id = cliente.Id },
                cliente);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> PutCliente(int id, Cliente cliente)
        {
            if (id != cliente.Id)
            {
                return BadRequest("El ID del cliente no coincide.");
            }

            var clienteExistente = await _context.Clientes.FindAsync(id);

            if (clienteExistente == null)
            {
                return NotFound("El cliente solicitado no existe.");
            }

            NormalizarCliente(cliente);

            var errorValidacion = ValidarCliente(cliente);

            if (errorValidacion != null)
            {
                return BadRequest(errorValidacion);
            }

            var documentoDuplicado = await _context.Clientes.AnyAsync(c =>
                c.Cedula == cliente.Cedula &&
                c.Id != id);

            if (documentoDuplicado)
            {
                return BadRequest(
                    $"Ya existe otro cliente registrado con este {ObtenerNombreDocumento(cliente.TipoPersona)}.");
            }

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

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);

            if (cliente == null)
            {
                return NotFound("El cliente solicitado no existe.");
            }

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

        private static void NormalizarCliente(Cliente cliente)
        {
            cliente.Nombre = (cliente.Nombre ?? string.Empty).Trim();
            cliente.TipoPersona = NormalizarTipoPersona(cliente.TipoPersona);
            cliente.Cedula = LimpiarDocumento(cliente.Cedula);

            cliente.NombreTitularTarjeta =
                LimpiarTextoOpcional(cliente.NombreTitularTarjeta);

            cliente.FechaExpiracionTarjeta =
                LimpiarTextoOpcional(cliente.FechaExpiracionTarjeta);

            cliente.NoTarjetaCr =
                LimpiarNumeroTarjeta(cliente.NoTarjetaCr);

            cliente.TipoTarjeta =
                DetectarTipoTarjeta(cliente.NoTarjetaCr);
        }

        private static string? ValidarCliente(Cliente cliente)
        {
            if (string.IsNullOrWhiteSpace(cliente.Nombre))
            {
                return cliente.TipoPersona == PersonaJuridica
                    ? "La razón social es obligatoria."
                    : "El nombre completo del cliente es obligatorio.";
            }

            if (!DocumentoValido(cliente.Cedula, cliente.TipoPersona))
            {
                return cliente.TipoPersona == PersonaJuridica
                    ? "El RNC ingresado no es válido."
                    : "La cédula ingresada no es válida.";
            }

            if (cliente.LimiteCredito < 0)
            {
                return "El límite de crédito no puede ser negativo.";
            }

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
            {
                return "El nombre del titular de la tarjeta es obligatorio.";
            }

            if (string.IsNullOrWhiteSpace(cliente.NoTarjetaCr))
            {
                return "El número de tarjeta es obligatorio.";
            }

            if (!NumeroTarjetaValido(cliente.NoTarjetaCr))
            {
                return "El número de tarjeta no es válido.";
            }

            if (string.IsNullOrWhiteSpace(cliente.TipoTarjeta))
            {
                return "La franquicia de la tarjeta no pudo ser identificada.";
            }

            if (!FechaExpiracionValida(cliente.FechaExpiracionTarjeta))
            {
                return "La fecha de expiración no es válida o la tarjeta está vencida.";
            }

            return null;
        }

        private static string NormalizarTipoPersona(string? tipoPersona)
        {
            return string.Equals(
                tipoPersona,
                PersonaJuridica,
                StringComparison.OrdinalIgnoreCase)
                    ? PersonaJuridica
                    : PersonaFisica;
        }

        private static string ObtenerNombreDocumento(string? tipoPersona)
        {
            return NormalizarTipoPersona(tipoPersona) == PersonaJuridica
                ? "RNC"
                : "cédula";
        }

        private static string LimpiarDocumento(string? documento)
        {
            return string.IsNullOrWhiteSpace(documento)
                ? string.Empty
                : new string(documento.Where(char.IsDigit).ToArray());
        }

        private static bool DocumentoValido(string documento, string? tipoPersona)
        {
            return NormalizarTipoPersona(tipoPersona) == PersonaJuridica
                ? RncValido(documento)
                : CedulaValida(documento);
        }

        private static string FormatearDocumento(string documento, string? tipoPersona)
        {
            documento = LimpiarDocumento(documento);

            if (NormalizarTipoPersona(tipoPersona) == PersonaJuridica)
            {
                return documento.Length == 9
                    ? $"{documento[..3]}-{documento.Substring(3, 5)}-{documento[8]}"
                    : documento;
            }

            return documento.Length == 11
                ? $"{documento[..3]}-{documento.Substring(3, 7)}-{documento[10]}"
                : documento;
        }

        private static bool CedulaValida(string cedula)
        {
            cedula = LimpiarDocumento(cedula);

            if (cedula.Length != 11 || cedula.All(c => c == cedula[0]))
            {
                return false;
            }

            int[] pesos = { 1, 2, 1, 2, 1, 2, 1, 2, 1, 2 };
            var suma = 0;

            for (var i = 0; i < 10; i++)
            {
                var valor = (cedula[i] - '0') * pesos[i];

                if (valor >= 10)
                {
                    valor = (valor / 10) + (valor % 10);
                }

                suma += valor;
            }

            var digitoVerificador = (10 - (suma % 10)) % 10;
            return digitoVerificador == (cedula[10] - '0');
        }

        private static bool RncValido(string rnc)
        {
            rnc = LimpiarDocumento(rnc);

            if (rnc.Length != 9 || rnc.All(c => c == rnc[0]))
            {
                return false;
            }

            int[] pesos = { 7, 9, 8, 6, 5, 4, 3, 2 };
            var suma = 0;

            for (var i = 0; i < 8; i++)
            {
                suma += (rnc[i] - '0') * pesos[i];
            }

            var resto = suma % 11;
            var digitoVerificador = resto switch
            {
                0 => 2,
                1 => 1,
                _ => 11 - resto
            };

            return digitoVerificador == (rnc[8] - '0');
        }

        private static string? LimpiarTextoOpcional(string? valor)
        {
            return string.IsNullOrWhiteSpace(valor)
                ? null
                : valor.Trim();
        }

        private static string? LimpiarNumeroTarjeta(string? numero)
        {
            return string.IsNullOrWhiteSpace(numero)
                ? null
                : new string(numero.Where(char.IsDigit).ToArray());
        }

        private static string? DetectarTipoTarjeta(string? numeroTarjeta)
        {
            var numero = LimpiarNumeroTarjeta(numeroTarjeta);

            if (string.IsNullOrWhiteSpace(numero))
            {
                return null;
            }

            if (numero.StartsWith("4")) return "VISA";
            if (EsMastercard(numero)) return "MASTERCARD";
            if (numero.StartsWith("34") || numero.StartsWith("37")) return "AMEX";
            if (numero.StartsWith("6")) return "DISCOVER";

            return null;
        }

        private static bool EsMastercard(string numero)
        {
            if (numero.Length < 2)
            {
                return false;
            }

            var primerosDos = int.Parse(numero[..2]);

            if (primerosDos is >= 51 and <= 55)
            {
                return true;
            }

            if (numero.Length < 4)
            {
                return false;
            }

            var primerosCuatro = int.Parse(numero[..4]);
            return primerosCuatro is >= 2221 and <= 2720;
        }

        private static bool NumeroTarjetaValido(string numeroTarjeta)
        {
            var numero = LimpiarNumeroTarjeta(numeroTarjeta);

            if (string.IsNullOrWhiteSpace(numero))
            {
                return false;
            }

            var tipo = DetectarTipoTarjeta(numero);
            var longitudValida = tipo switch
            {
                "AMEX" => numero.Length == 15,
                "VISA" => numero.Length is 13 or 16 or 19,
                "MASTERCARD" => numero.Length == 16,
                "DISCOVER" => numero.Length is 16 or 19,
                _ => false
            };

            return longitudValida && CumpleAlgoritmoLuhn(numero);
        }

        private static bool CumpleAlgoritmoLuhn(string numero)
        {
            var suma = 0;
            var duplicar = false;

            for (var i = numero.Length - 1; i >= 0; i--)
            {
                var digito = numero[i] - '0';

                if (duplicar)
                {
                    digito *= 2;
                    if (digito > 9) digito -= 9;
                }

                suma += digito;
                duplicar = !duplicar;
            }

            return suma % 10 == 0;
        }

        private static bool FechaExpiracionValida(string? fecha)
        {
            if (string.IsNullOrWhiteSpace(fecha) ||
                !Regex.IsMatch(fecha, @"^(0[1-9]|1[0-2])\/\d{2}$"))
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
