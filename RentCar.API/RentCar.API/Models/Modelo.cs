using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RentCar.API.Models;

public partial class Modelo
{
    public int Id { get; set; }

    [Required, Range(1, int.MaxValue)]
    public int? IdMarca { get; set; }

    [Required, StringLength(100, MinimumLength = 2)]
    public string? Descripcion { get; set; }

    public bool? Estado { get; set; }

    [JsonIgnore]
    public virtual Marca? IdMarcaNavigation { get; set; }
}
