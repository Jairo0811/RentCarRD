using System;
using System.Collections.Generic;

namespace RentCar.API.Models;

public partial class Marca
{
    public int Id { get; set; }

    public string? Descripcion { get; set; }

    public bool? Estado { get; set; }

    public virtual ICollection<Modelo> Modelos { get; set; } = new List<Modelo>();
}
