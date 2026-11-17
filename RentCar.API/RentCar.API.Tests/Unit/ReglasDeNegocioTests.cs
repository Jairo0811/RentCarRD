using RentCar.API.Controllers;
using RentCar.API.Domain;
using RentCar.API.Dtos;

namespace RentCar.API.Tests.Unit;

public class CalculadoraRentaTests
{
    [Theory]
    [InlineData(1500, 3, 4500, 810, 5310)]
    [InlineData(2500.50, 2, 5001, 900.18, 5901.18)]
    // 100.25 × 18 % = 18.045 → redondeo comercial a 18.05 (antes, el redondeo bancario daba 18.04).
    [InlineData(100.25, 1, 100.25, 18.05, 118.30)]
    [InlineData(0.01, 1, 0.01, 0, 0.01)]
    public void Calcula_subtotal_itbis_y_total_con_dos_decimales(
        double tarifa, int dias, double subtotal, double itbis, double total)
    {
        var resultado = CalculadoraRenta.Calcular((decimal)tarifa, dias);

        Assert.Equal((decimal)subtotal, resultado.Subtotal);
        Assert.Equal((decimal)itbis, resultado.Itbis);
        Assert.Equal((decimal)total, resultado.Total);
        Assert.Equal(resultado.Subtotal + resultado.Itbis, resultado.Total);
    }

    [Fact]
    public void Fecha_prevista_suma_los_dias_contratados_a_la_fecha_de_renta()
    {
        var prevista = CalculadoraRenta.FechaPrevista(new DateTime(2026, 11, 28, 22, 30, 0), 5);
        Assert.Equal(new DateTime(2026, 12, 3), prevista);
    }
}

public class DocumentosDominicanosTests
{
    [Theory]
    [InlineData("001-0000001-7", true)]
    [InlineData("00100000017", true)]
    [InlineData("402-1242850-8", true)]
    [InlineData("00100000018", false)]
    [InlineData("11111111111", false)]
    [InlineData("123", false)]
    [InlineData("", false)]
    public void Valida_cedula(string cedula, bool esperado) =>
        Assert.Equal(esperado, DocumentosDominicanos.CedulaValida(cedula));

    [Theory]
    [InlineData("101-01234-1", true)]
    [InlineData("131987656", true)]
    [InlineData("101012345", false)]
    [InlineData("999999999", false)]
    public void Valida_rnc(string rnc, bool esperado) =>
        Assert.Equal(esperado, DocumentosDominicanos.RncValido(rnc));
}

public class MetodoPagoSimuladoTests
{
    private static ClienteRequest Base() => new()
    {
        Nombre = "Cliente Prueba",
        Cedula = "001-0000001-7",
        TipoPersona = "Fisica",
        LimiteCredito = 1000,
        Estado = true
    };

    [Fact]
    public void Acepta_marca_y_ultimos_cuatro_digitos()
    {
        var request = Base();
        request.TipoTarjeta = "visa";
        request.UltimosDigitosTarjeta = "4242";

        var (cliente, error) = ClientesController.Construir(request);

        Assert.Null(error);
        Assert.Equal("VISA", cliente!.TipoTarjeta);
        Assert.Equal("4242", cliente.UltimosDigitosTarjeta);
    }

    [Theory]
    [InlineData("4111111111111111")]
    [InlineData("4111 1111 1111 1111")]
    [InlineData("12345")]
    [InlineData("12a4")]
    public void Rechaza_numeros_completos_o_invalidos_sin_truncarlos(string digitos)
    {
        var request = Base();
        request.TipoTarjeta = "VISA";
        request.UltimosDigitosTarjeta = digitos;

        var (cliente, error) = ClientesController.Construir(request);

        Assert.Null(cliente);
        Assert.Contains("últimos 4 dígitos", error);
    }

    [Fact]
    public void Exige_marca_y_digitos_juntos()
    {
        var request = Base();
        request.UltimosDigitosTarjeta = "4242";
        Assert.NotNull(ClientesController.Construir(request).Error);
    }

    [Fact]
    public void Sin_metodo_de_pago_es_valido()
    {
        var (cliente, error) = ClientesController.Construir(Base());
        Assert.Null(error);
        Assert.Null(cliente!.UltimosDigitosTarjeta);
        Assert.Null(cliente.TipoTarjeta);
    }

    [Fact]
    public void Rechaza_documento_invalido()
    {
        var request = Base();
        request.Cedula = "00100000018";
        Assert.Equal("La cédula ingresada no es válida.", ClientesController.Construir(request).Error);
    }
}

public class PoliticaPasswordTests
{
    [Theory]
    [InlineData("corta1", false)]
    [InlineData("soloLetrasLargas", false)]
    [InlineData("1234567890", false)]
    [InlineData("Segura2026", true)]
    public void Aplica_politica_minima(string password, bool valida) =>
        Assert.Equal(valida, EmpleadosController.ValidarPassword(password) is null);
}
