namespace RentCar.API.Infrastructure;

/// <summary>
/// Fecha de calendario del negocio (República Dominicana por defecto), independiente
/// de la zona horaria del servidor. Evita que una devolución registrada a las 21:00
/// en Santo Domingo quede con fecha del día siguiente en un servidor UTC.
/// </summary>
public interface IFechaNegocio
{
    DateTime Hoy();
}

public sealed class FechaNegocio : IFechaNegocio
{
    private readonly TimeProvider _reloj;
    private readonly TimeZoneInfo _zona;

    public FechaNegocio(TimeProvider reloj, IConfiguration configuration)
    {
        _reloj = reloj;
        var zona = configuration["Negocio:ZonaHoraria"];
        _zona = TimeZoneInfo.FindSystemTimeZoneById(
            string.IsNullOrWhiteSpace(zona) ? "America/Santo_Domingo" : zona);
    }

    public DateTime Hoy() =>
        TimeZoneInfo.ConvertTime(_reloj.GetUtcNow(), _zona).Date;
}
