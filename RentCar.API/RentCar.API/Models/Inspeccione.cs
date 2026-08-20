using System.ComponentModel.DataAnnotations;

namespace RentCar.API.Models;

public partial class Inspeccione
{
    public int IdTransaccion { get; set; }

    [Range(1, int.MaxValue)]
    public int IdVehiculo { get; set; }

    [Range(1, int.MaxValue)]
    public int IdCliente { get; set; }

    public bool TieneRalladuras { get; set; }

    [Required, RegularExpression(@"^(1/4|1/2|3/4|Lleno)$")]
    public string CantidadCombustible { get; set; } = null!;

    public bool TieneGomaRespuesta { get; set; }

    public bool TieneGato { get; set; }

    public bool TieneRoturasCristal { get; set; }

    public bool GomaDelanteraDerecha { get; set; }

    public bool GomaDelanteraIzquierda { get; set; }

    public bool GomaTraseraDerecha { get; set; }

    public bool GomaTraseraIzquierda { get; set; }

    public DateTime Fecha { get; set; }

    [Range(1, int.MaxValue)]
    public int IdEmpleadoInspeccion { get; set; }

    public bool Estado { get; set; }
}
