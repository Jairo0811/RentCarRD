using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace RentCar.API.Models;

public partial class Empleado
{
    public int Id { get; set; }

    public string Nombre { get; set; } = null!;

    public string Cedula { get; set; } = null!;

    public string TandaLabor { get; set; } = null!;

    public int PorcientoComision { get; set; }

    public DateTime FechaIngreso { get; set; }

    public bool Estado { get; set; }

    public string Usuario { get; set; } = string.Empty;

    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [NotMapped]
    public string? Password { get; set; }
}
