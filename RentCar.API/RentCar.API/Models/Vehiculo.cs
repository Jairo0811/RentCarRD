using System;
using System.Collections.Generic;

namespace RentCar.API.Models;

public partial class Vehiculo
{
    public int Id { get; set; }

    public string? Descripcion { get; set; }

    public string? NoChasis { get; set; }

    public string? NoMotor { get; set; }

    public string? NoPlaca { get; set; }

    public int? IdTipoVehiculo { get; set; }

    public int? IdMarca { get; set; }

    public int? IdModelo { get; set; }

    public int? IdTipoCombustible { get; set; }

    public bool? Estado { get; set; }
}