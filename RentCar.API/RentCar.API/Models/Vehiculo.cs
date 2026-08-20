using System.ComponentModel.DataAnnotations;

namespace RentCar.API.Models;

public partial class Vehiculo
{
    public int Id { get; set; }

    [Required, StringLength(200, MinimumLength = 3)]
    public string? Descripcion { get; set; }

    [StringLength(17, MinimumLength = 8)]
    public string? NoChasis { get; set; }

    [StringLength(50)]
    public string? NoMotor { get; set; }

    [Required, StringLength(7, MinimumLength = 5)]
    [RegularExpression(@"^[A-Za-z0-9]+$")]
    public string? NoPlaca { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? IdTipoVehiculo { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? IdMarca { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? IdModelo { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? IdTipoCombustible { get; set; }

    public int? IdCombustible { get; set; }

    /*
     * Se conserva por compatibilidad:
     * true  = disponible
     * false = rentado o no disponible
     */
    public bool? Estado { get; set; }

    /*
     * Estados permitidos:
     * Disponible
     * Rentado
     * NoDisponible
     */
    [Required, RegularExpression("^(Disponible|Rentado|NoDisponible)$")]
    public string EstadoOperacion { get; set; } = "Disponible";

    [StringLength(300)]
    public string? ImagenUrl { get; set; }
}
