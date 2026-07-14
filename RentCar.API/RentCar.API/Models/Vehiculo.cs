namespace RentCar.API.Models;

public partial class Vehiculo
{
    public int Id { get; set; }

    public string? Descripcion { get; set; }

    public string? NoChasis { get; set; }

    public string? NoMotor { get; set; }

    public string? NoPlaca { get; set; }

    public int? IdTipoVehiculo { get; set; }

    public int? IdMarca { get; set; }

    public int? IdModelo { get; set; }

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
    public string EstadoOperacion { get; set; } = "Disponible";

    public string? ImagenUrl { get; set; }
}