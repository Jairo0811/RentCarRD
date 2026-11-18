namespace RentCar.API.Domain;

/// <summary>
/// Cálculo monetario académico de RentCarRD: subtotal = tarifa × días,
/// ITBIS = 18 % del subtotal, total = subtotal + ITBIS.
/// Cada importe se redondea a dos decimales con redondeo comercial (half away from zero),
/// que es el criterio habitual en facturación y coincide con el frontend.
/// </summary>
public static class CalculadoraRenta
{
    public const decimal TasaItbis = 0.18m;
    public const int DiasMaximos = 365;
    public const decimal TarifaMaxima = 1_000_000m;

    public static (decimal Subtotal, decimal Itbis, decimal Total) Calcular(decimal montoPorDia, int cantidadDias)
    {
        var subtotal = Redondear(montoPorDia * cantidadDias);
        var itbis = Redondear(subtotal * TasaItbis);
        return (subtotal, itbis, subtotal + itbis);
    }

    public static decimal Redondear(decimal valor) =>
        Math.Round(valor, 2, MidpointRounding.AwayFromZero);

    /// <summary>Fecha prevista de devolución: fecha de renta + días contratados.</summary>
    public static DateTime FechaPrevista(DateTime fechaRenta, int cantidadDias) =>
        fechaRenta.Date.AddDays(cantidadDias);
}
