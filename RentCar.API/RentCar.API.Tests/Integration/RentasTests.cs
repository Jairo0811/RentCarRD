using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace RentCar.API.Tests.Integration;

[Collection(ColeccionApi.Nombre)]
public class RentasTests(RentCarApiFactory api)
{
    private static object Renta(int vehiculo, int cliente, decimal monto = 2000, int dias = 3) => new
    {
        idVehiculo = vehiculo,
        idCliente = cliente,
        fechaRenta = DateTime.Today,
        montoXDia = monto,
        cantidadDias = dias,
        comentario = "  Prueba automatizada  "
    };

    [Fact]
    public async Task Crear_renta_calcula_importes_y_marca_el_vehiculo_como_rentado()
    {
        var admin = await api.AdminAsync();
        var vehiculo = await Datos.CrearVehiculoAsync(admin);
        var cliente = await Datos.CrearClienteAsync(admin);

        var respuesta = await admin.PostAsJsonAsync("/api/rentas", Renta(vehiculo, cliente, 2500.50m, 2));
        await respuesta.AssertEstadoAsync(HttpStatusCode.Created);
        var renta = await respuesta.LeerAsync<JsonElement>();

        Assert.Equal(5001.00m, renta.GetProperty("subtotal").GetDecimal());
        Assert.Equal(900.18m, renta.GetProperty("itbis").GetDecimal());
        Assert.Equal(5901.18m, renta.GetProperty("total").GetDecimal());
        Assert.Equal("Activa", renta.GetProperty("estado").GetString());
        Assert.Equal("Prueba automatizada", renta.GetProperty("comentario").GetString());
        Assert.Equal(JsonValueKind.Null, renta.GetProperty("fechaDevolucion").ValueKind);
        Assert.Equal(DateTime.Today.AddDays(2), renta.GetProperty("fechaDevolucionPrevista").GetDateTime());

        var estado = await (await admin.GetAsync($"/api/vehiculos/{vehiculo}")).LeerAsync<JsonElement>();
        Assert.Equal("Rentado", estado.GetProperty("estadoOperacion").GetString());
        Assert.False(estado.GetProperty("estado").GetBoolean());
    }

    [Fact]
    public async Task Itbis_usa_redondeo_comercial_a_dos_decimales()
    {
        var admin = await api.AdminAsync();
        var renta = await (await admin.PostAsJsonAsync("/api/rentas",
                Renta(await Datos.CrearVehiculoAsync(admin), await Datos.CrearClienteAsync(admin), 100.25m, 1)))
            .LeerAsync<JsonElement>();

        Assert.Equal(100.25m, renta.GetProperty("subtotal").GetDecimal());
        Assert.Equal(18.05m, renta.GetProperty("itbis").GetDecimal());
        Assert.Equal(118.30m, renta.GetProperty("total").GetDecimal());
    }

    [Theory]
    [InlineData(0, 1)]
    [InlineData(-10, 1)]
    [InlineData(100, 0)]
    [InlineData(100, 366)]
    public async Task Rechaza_importes_o_dias_invalidos(decimal monto, int dias)
    {
        var admin = await api.AdminAsync();
        var respuesta = await admin.PostAsJsonAsync("/api/rentas",
            Renta(await Datos.CrearVehiculoAsync(admin), await Datos.CrearClienteAsync(admin), monto, dias));
        await respuesta.AssertEstadoAsync(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Rechaza_cliente_inexistente_o_inactivo()
    {
        var admin = await api.AdminAsync();
        var vehiculo = await Datos.CrearVehiculoAsync(admin);
        await (await admin.PostAsJsonAsync("/api/rentas", Renta(vehiculo, 999_999))).AssertEstadoAsync(HttpStatusCode.BadRequest);

        var inactivo = await admin.CrearIdAsync("/api/clientes", new
        {
            nombre = "Cliente inactivo", cedula = Datos.Cedula(), tipoPersona = "Fisica", limiteCredito = 0, estado = false
        });
        var cliente = await (await admin.GetAsync($"/api/clientes/{inactivo}")).LeerAsync<JsonElement>();
        Assert.False(cliente.GetProperty("estado").GetBoolean()); // el valor false se persiste (no lo pisa el DEFAULT)

        await (await admin.PostAsJsonAsync("/api/rentas", Renta(vehiculo, inactivo))).AssertEstadoAsync(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Vehiculo_no_disponible_no_puede_rentarse()
    {
        var admin = await api.AdminAsync();
        var vehiculo = await Datos.CrearVehiculoAsync(admin);
        var cliente = await Datos.CrearClienteAsync(admin);

        await (await admin.PostAsJsonAsync("/api/rentas", Renta(vehiculo, cliente))).AssertEstadoAsync(HttpStatusCode.Created);
        var segunda = await admin.PostAsJsonAsync("/api/rentas", Renta(vehiculo, cliente));

        await segunda.AssertEstadoAsync(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Dos_solicitudes_concurrentes_no_pueden_alquilar_el_mismo_vehiculo()
    {
        var admin = await api.AdminAsync();
        var (_, usuario, password) = await Datos.CrearEmpleadoAsync(admin);
        var empleado = await api.ClienteAutenticadoAsync(usuario, password);

        for (var intento = 0; intento < 5; intento++)
        {
            var vehiculo = await Datos.CrearVehiculoAsync(admin);
            var cliente = await Datos.CrearClienteAsync(admin);

            var resultados = await Task.WhenAll(
                admin.PostAsJsonAsync("/api/rentas", Renta(vehiculo, cliente)),
                empleado.PostAsJsonAsync("/api/rentas", Renta(vehiculo, cliente)),
                admin.PostAsJsonAsync("/api/rentas", Renta(vehiculo, cliente)));

            var estados = resultados.Select(r => r.StatusCode).ToArray();
            Assert.Equal(1, estados.Count(e => e == HttpStatusCode.Created));
            Assert.All(estados.Where(e => e != HttpStatusCode.Created), e => Assert.Equal(HttpStatusCode.Conflict, e));

            await using var db = api.CrearDbContext();
            Assert.Equal(1, await db.Rentas.CountAsync(r => r.IdVehiculo == vehiculo));
        }
    }

    [Fact]
    public async Task Devolucion_concluye_la_renta_con_fecha_real_y_deja_el_vehiculo_no_disponible()
    {
        var admin = await api.AdminAsync();
        var vehiculo = await Datos.CrearVehiculoAsync(admin);
        var renta = await (await admin.PostAsJsonAsync("/api/rentas",
            Renta(vehiculo, await Datos.CrearClienteAsync(admin), 1000, 7))).LeerAsync<JsonElement>();
        var id = renta.GetProperty("noRenta").GetInt32();

        var devolucion = await admin.PutAsync($"/api/rentas/{id}/devolucion", null);
        var cuerpo = await devolucion.LeerAsync<JsonElement>();

        Assert.Equal("Concluida", cuerpo.GetProperty("estado").GetString());
        Assert.Equal("NoDisponible", cuerpo.GetProperty("estadoVehiculo").GetString());
        // Fecha real (hoy), no la prevista (hoy + 7).
        var fechaReal = cuerpo.GetProperty("fechaDevolucion").GetDateTime();
        Assert.True(Math.Abs((fechaReal - DateTime.Today).TotalDays) <= 1);
        Assert.Equal(DateTime.Today.AddDays(7), cuerpo.GetProperty("fechaDevolucionPrevista").GetDateTime());
        // Importes contractuales intactos.
        Assert.Equal(8260.00m, cuerpo.GetProperty("total").GetDecimal());
    }

    [Fact]
    public async Task Devolucion_repetida_devuelve_409_y_no_cambia_nada()
    {
        var admin = await api.AdminAsync();
        var renta = await (await admin.PostAsJsonAsync("/api/rentas",
            Renta(await Datos.CrearVehiculoAsync(admin), await Datos.CrearClienteAsync(admin)))).LeerAsync<JsonElement>();
        var id = renta.GetProperty("noRenta").GetInt32();

        await (await admin.PutAsync($"/api/rentas/{id}/devolucion", null)).AssertEstadoAsync(HttpStatusCode.OK);
        await (await admin.PutAsync($"/api/rentas/{id}/devolucion", null)).AssertEstadoAsync(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Devoluciones_concurrentes_solo_se_procesan_una_vez()
    {
        var admin = await api.AdminAsync();
        var renta = await (await admin.PostAsJsonAsync("/api/rentas",
            Renta(await Datos.CrearVehiculoAsync(admin), await Datos.CrearClienteAsync(admin)))).LeerAsync<JsonElement>();
        var id = renta.GetProperty("noRenta").GetInt32();

        var resultados = await Task.WhenAll(
            admin.PutAsync($"/api/rentas/{id}/devolucion", null),
            admin.PutAsync($"/api/rentas/{id}/devolucion", null));

        Assert.Equal(1, resultados.Count(r => r.StatusCode == HttpStatusCode.OK));
        Assert.Equal(1, resultados.Count(r => r.StatusCode == HttpStatusCode.Conflict));
    }

    [Fact]
    public async Task Vehiculo_devuelto_no_vuelve_a_rentarse_ni_a_marcarse_disponible()
    {
        var admin = await api.AdminAsync();
        var vehiculo = await Datos.CrearVehiculoAsync(admin);
        var cliente = await Datos.CrearClienteAsync(admin);
        var renta = await (await admin.PostAsJsonAsync("/api/rentas", Renta(vehiculo, cliente))).LeerAsync<JsonElement>();
        await (await admin.PutAsync($"/api/rentas/{renta.GetProperty("noRenta").GetInt32()}/devolucion", null))
            .AssertEstadoAsync(HttpStatusCode.OK);

        await (await admin.PostAsJsonAsync("/api/rentas", Renta(vehiculo, cliente))).AssertEstadoAsync(HttpStatusCode.Conflict);

        var actual = await (await admin.GetAsync($"/api/vehiculos/{vehiculo}")).LeerAsync<JsonElement>();
        var cambio = JsonSerializer.Deserialize<Dictionary<string, object?>>(actual.GetRawText())!;
        cambio["estadoOperacion"] = "Disponible";
        await (await admin.PutAsJsonAsync($"/api/vehiculos/{vehiculo}", cambio)).AssertEstadoAsync(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Las_rentas_no_se_eliminan()
    {
        var admin = await api.AdminAsync();
        var renta = await (await admin.PostAsJsonAsync("/api/rentas",
            Renta(await Datos.CrearVehiculoAsync(admin), await Datos.CrearClienteAsync(admin)))).LeerAsync<JsonElement>();
        await (await admin.DeleteAsync($"/api/rentas/{renta.GetProperty("noRenta").GetInt32()}"))
            .AssertEstadoAsync(HttpStatusCode.Conflict);
    }
}
