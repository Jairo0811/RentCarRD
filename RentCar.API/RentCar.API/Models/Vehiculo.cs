using System;
using System.Collections.Generic;

namespace RentCar.API.Models;

public partial class Vehiculo
{
    public int Id { get; set; }

    public string Descripcion { get; set; } = null!;

    public string NoChasis { get; set; } = null!;

    public string NoPlaca { get; set; } = null!;

    public bool Estado { get; set; }
}
