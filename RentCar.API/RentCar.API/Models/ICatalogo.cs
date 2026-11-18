namespace RentCar.API.Models;

/// <summary>Catálogo simple (descripción + estado) compartido por marcas y tipos.</summary>
public interface ICatalogo
{
    int Id { get; set; }
    string? Descripcion { get; set; }
    bool? Estado { get; set; }
}

public partial class Marca : ICatalogo
{
}

public partial class TiposVehiculo : ICatalogo
{
}

public partial class TiposCombustible : ICatalogo
{
}
