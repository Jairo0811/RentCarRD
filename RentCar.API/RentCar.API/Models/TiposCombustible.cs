using System;
using System.Collections.Generic;

namespace RentCar.API.Models;

public partial class TiposCombustible
{
    public int Id { get; set; }

    public string? Descripcion { get; set; }

    public bool? Estado { get; set; }
}
