namespace RentCar.API.Models;

public partial class Cliente
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    /// <summary>Cédula (11 dígitos) o RNC (9 dígitos), sin guiones.</summary>
    public string Cedula { get; set; } = null!;

    /// <summary>
    /// Método de pago simulado: únicamente los últimos cuatro dígitos de referencia.
    /// RentCarRD no procesa pagos y nunca recibe ni almacena el número completo (PAN),
    /// el titular, la fecha de expiración ni el CVV. Se conserva el nombre histórico
    /// de la columna (NoTarjetaCR) para no perder compatibilidad con la base existente.
    /// </summary>
    public string? UltimosDigitosTarjeta { get; set; }

    /// <summary>Marca del método simulado: VISA, MASTERCARD, AMEX o DISCOVER.</summary>
    public string? TipoTarjeta { get; set; }

    public decimal LimiteCredito { get; set; }

    public string? TipoPersona { get; set; }

    public bool Estado { get; set; }
}
