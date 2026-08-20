using System.ComponentModel.DataAnnotations;

namespace RentCar.API.Models;

public partial class Cliente
{
    public int Id { get; set; }

    [Required, StringLength(150, MinimumLength = 3)]
    public string Nombre { get; set; } = null!;

    [Required, RegularExpression(@"^(\d{9}|\d{11})$")]
    public string Cedula { get; set; } = null!;

    [Range(0, 100_000_000)]
    public decimal LimiteCredito { get; set; }

    [Required, RegularExpression("^(Fisica|Juridica)$")]
    public string? TipoPersona { get; set; }

    public bool Estado { get; set; }
}
