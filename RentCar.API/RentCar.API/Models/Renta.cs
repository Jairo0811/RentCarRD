using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RentCar.API.Models;

public partial class Renta
{
    public int NoRenta { get; set; }

    [Range(1, int.MaxValue)]
    public int IdEmpleado { get; set; }

    [Range(1, int.MaxValue)]
    public int IdVehiculo { get; set; }

    [Range(1, int.MaxValue)]
    public int IdCliente { get; set; }

    public DateTime FechaRenta { get; set; }

    public DateTime? FechaDevolucion { get; set; }

    [JsonPropertyName("montoXDia")]
    [Range(typeof(decimal), "0.01", "10000000")]
    public decimal MontoXdia { get; set; }

    [Range(1, 3650)]
    public int CantidadDias { get; set; }

    public decimal Subtotal { get; set; }

    public decimal Itbis { get; set; }

    public decimal Total { get; set; }

    [StringLength(1000)]
    public string Comentario { get; set; } = string.Empty;

    [RegularExpression("^(Activa|Concluida)$")]
    public string Estado { get; set; } = "Activa";
}
