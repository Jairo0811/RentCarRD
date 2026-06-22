using System;
using System.Collections.Generic;

namespace RentCar.API.Models;

public partial class Cliente
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public string Cedula { get; set; } = null!;

    public decimal LimiteCredito { get; set; }

    public bool Estado { get; set; }
}
