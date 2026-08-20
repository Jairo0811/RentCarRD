using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RentCar.API.Models;

public partial class Empleado
{
    public int Id { get; set; }

    [Required, StringLength(150, MinimumLength = 3)]
    public string Nombre { get; set; } = null!;

    [Required, RegularExpression(@"^\d{11}$")]
    public string Cedula { get; set; } = null!;

    [Required, StringLength(80)]
    public string TandaLabor { get; set; } = null!;

    [Range(0, 100)]
    public int PorcientoComision { get; set; }

    public DateTime FechaIngreso { get; set; }

    public bool Estado { get; set; }

    [Required, StringLength(100, MinimumLength = 3)]
    [RegularExpression(@"^[a-zA-Z0-9._-]+$")]
    public string Usuario { get; set; } = string.Empty;

    [Required, StringLength(30)]
    public string Rol { get; set; } = "Empleado";

    [JsonIgnore]
    public string? PasswordHash { get; set; }

    [NotMapped]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    [StringLength(200, MinimumLength = 12)]
    public string? Password { get; set; }
}
