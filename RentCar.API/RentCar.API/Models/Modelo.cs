using System;
using System.Collections.Generic;

namespace RentCar.API.Models;

public partial class Modelo
{
    public int Id { get; set; }

    public int? IdMarca { get; set; }

    public string? Descripcion { get; set; }

    public bool? Estado { get; set; }

    public virtual Marca? IdMarcaNavigation { get; set; }
}
