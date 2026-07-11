namespace RentCar.API.Models;

public partial class Cliente
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public string Cedula { get; set; } = null!;

    public string? NoTarjetaCr { get; set; }

    public string? NombreTitularTarjeta { get; set; }

    public string? FechaExpiracionTarjeta { get; set; }

    public string? TipoTarjeta { get; set; }

    public decimal LimiteCredito { get; set; }

    public string? TipoPersona { get; set; }

    public bool Estado { get; set; }
}