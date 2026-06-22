using System;
using System.Collections.Generic;

namespace RentCar.API.Models;

public partial class Inspeccione
{
    public int IdTransaccion { get; set; }

    public int IdVehiculo { get; set; }

    public int IdCliente { get; set; }

    public bool TieneRalladuras { get; set; }

    public string CantidadCombustible { get; set; } = null!;

    public bool TieneGomaRespuesta { get; set; }

    public bool TieneGato { get; set; }

    public bool TieneRoturasCristal { get; set; }

    public bool GomaDelanteraDerecha { get; set; }

    public bool GomaDelanteraIzquierda { get; set; }

    public bool GomaTraseraDerecha { get; set; }

    public bool GomaTraseraIzquierda { get; set; }

    public DateTime Fecha { get; set; }

    public int IdEmpleadoInspeccion { get; set; }

    public bool Estado { get; set; }
}
