using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RentCar.API.Models;

public partial class Marca
{
    public int Id { get; set; }

    [Required, StringLength(100, MinimumLength = 2)]
    public string? Descripcion { get; set; }

    public bool? Estado { get; set; }

    [JsonIgnore]
    public virtual ICollection<Modelo> Modelos { get; set; } = new List<Modelo>();
}
