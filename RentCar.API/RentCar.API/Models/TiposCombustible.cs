using System.ComponentModel.DataAnnotations;

namespace RentCar.API.Models;

public partial class TiposCombustible
{
    public int Id { get; set; }

    [Required, StringLength(100, MinimumLength = 2)]
    public string? Descripcion { get; set; }

    public bool? Estado { get; set; }
}
