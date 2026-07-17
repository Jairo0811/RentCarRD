using System.Text.Json.Serialization;

namespace RentCar.API.Models;

public partial class Renta
{
    public int NoRenta { get; set; }

    public int IdEmpleado { get; set; }

    public int IdVehiculo { get; set; }

    public int IdCliente { get; set; }

    public DateTime FechaRenta { get; set; }

    public DateTime? FechaDevolucion { get; set; }

    [JsonPropertyName("montoXDia")]
    public decimal MontoXdia { get; set; }

    public int CantidadDias { get; set; }

    public decimal Subtotal { get; set; }

    public decimal Itbis { get; set; }

    public decimal Total { get; set; }

    public string Comentario { get; set; } = string.Empty;

    public string Estado { get; set; } = "Activa";
}