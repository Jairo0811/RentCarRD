using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Infrastructure;
using RentCar.API.Models;
using RentCar.API.Tests.Unit;

namespace RentCar.API.Tests.Integration;

[Collection(ColeccionApi.Nombre)]
public class CatalogosYRegistrosTests(RentCarApiFactory api)
{
    [Fact]
    public async Task Cliente_con_documento_invalido_devuelve_400()
    {
        var admin = await api.AdminAsync();
        var respuesta = await admin.PostAsJsonAsync("/api/clientes", new
        {
            nombre = "Documento inválido", cedula = "00100000018", tipoPersona = "Fisica", limiteCredito = 0, estado = true
        });
        await respuesta.AssertEstadoAsync(HttpStatusCode.BadRequest);

        var rnc = await admin.PostAsJsonAsync("/api/clientes", new
        {
            nombre = "Empresa", cedula = "101012345", tipoPersona = "Juridica", limiteCredito = 0, estado = true
        });
        await rnc.AssertEstadoAsync(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("Fisica")]
    [InlineData("Juridica")]
    public async Task Documento_duplicado_devuelve_409(string tipoPersona)
    {
        var admin = await api.AdminAsync();
        var documento = tipoPersona == "Fisica" ? Datos.Cedula() : Datos.Rnc();
        object Cuerpo() => new { nombre = $"Cliente {Datos.Siguiente()}", cedula = documento, tipoPersona, limiteCredito = 0, estado = true };

        await (await admin.PostAsJsonAsync("/api/clientes", Cuerpo())).AssertEstadoAsync(HttpStatusCode.Created);
        await (await admin.PostAsJsonAsync("/api/clientes", Cuerpo())).AssertEstadoAsync(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Cliente_nunca_acepta_ni_devuelve_datos_completos_de_tarjeta()
    {
        var admin = await api.AdminAsync();

        var conPan = await admin.PostAsJsonAsync("/api/clientes", new
        {
            nombre = "Cliente PAN", cedula = Datos.Cedula(), tipoPersona = "Fisica", limiteCredito = 0, estado = true,
            tipoTarjeta = "VISA", ultimosDigitosTarjeta = "4111111111111111"
        });
        await conPan.AssertEstadoAsync(HttpStatusCode.BadRequest);

        // Campos históricos (PAN, titular, expiración, CVV) se ignoran: no existen en el contrato.
        var id = await admin.CrearIdAsync("/api/clientes", new
        {
            nombre = "Cliente seguro", cedula = Datos.Cedula(), tipoPersona = "Fisica", limiteCredito = 0, estado = true,
            tipoTarjeta = "MASTERCARD", ultimosDigitosTarjeta = "5454",
            noTarjetaCr = "5555555555554444", nombreTitularTarjeta = "Titular", fechaExpiracionTarjeta = "12/30", cvv = "123"
        });

        var json = await (await admin.GetAsync($"/api/clientes/{id}")).Content.ReadAsStringAsync();
        Assert.Contains("\"ultimosDigitosTarjeta\":\"5454\"", json);
        Assert.DoesNotContain("5555555555554444", json);
        Assert.DoesNotContain("Titular", json);
        Assert.DoesNotContain("12/30", json);
        Assert.DoesNotContain("cvv", json, StringComparison.OrdinalIgnoreCase);

        await using var db = api.CrearDbContext();
        var guardado = await db.Clientes.AsNoTracking().SingleAsync(c => c.Id == id);
        Assert.Equal("5454", guardado.UltimosDigitosTarjeta);
    }

    [Fact]
    public async Task Placa_duplicada_devuelve_409()
    {
        var admin = await api.AdminAsync();
        var placa = Datos.Placa();
        await Datos.CrearVehiculoAsync(admin, placa);

        var vehiculo = await (await admin.GetAsync("/api/vehiculos")).LeerAsync<JsonElement>();
        var plantilla = vehiculo.EnumerateArray().First(v => v.GetProperty("noPlaca").GetString() == placa);
        var copia = JsonSerializer.Deserialize<Dictionary<string, object?>>(plantilla.GetRawText())!;
        copia["noChasis"] = null;

        await (await admin.PostAsJsonAsync("/api/vehiculos", copia)).AssertEstadoAsync(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task Vehiculo_valida_que_el_modelo_pertenezca_a_la_marca()
    {
        var admin = await api.AdminAsync();
        var marcaA = await admin.CrearIdAsync("/api/marcas", new { descripcion = $"Marca A {Datos.Siguiente()}" });
        var marcaB = await admin.CrearIdAsync("/api/marcas", new { descripcion = $"Marca B {Datos.Siguiente()}" });
        var modeloB = await admin.CrearIdAsync("/api/modelos", new { idMarca = marcaB, descripcion = "Modelo B" });
        var tipo = await admin.CrearIdAsync("/api/tiposvehiculos", new { descripcion = $"Tipo {Datos.Siguiente()}" });
        var comb = await admin.CrearIdAsync("/api/tiposcombustibles", new { descripcion = $"Comb {Datos.Siguiente()}" });

        var respuesta = await admin.PostAsJsonAsync("/api/vehiculos", new
        {
            descripcion = "Incoherente", noPlaca = Datos.Placa(), idMarca = marcaA, idModelo = modeloB,
            idTipoVehiculo = tipo, idTipoCombustible = comb, estadoOperacion = "Disponible"
        });
        await respuesta.AssertEstadoAsync(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Catalogos_validan_duplicados_inexistentes_y_registros_en_uso()
    {
        var admin = await api.AdminAsync();
        var descripcion = $"Marca única {Datos.Siguiente()}";
        var marca = await admin.CrearIdAsync("/api/marcas", new { descripcion });

        await (await admin.PostAsJsonAsync("/api/marcas", new { descripcion = descripcion.ToUpperInvariant() }))
            .AssertEstadoAsync(HttpStatusCode.Conflict);
        await (await admin.PostAsJsonAsync("/api/marcas", new { descripcion = "   " }))
            .AssertEstadoAsync(HttpStatusCode.BadRequest);
        await (await admin.PutAsJsonAsync("/api/marcas/999999", new { descripcion = "No existe" }))
            .AssertEstadoAsync(HttpStatusCode.NotFound);
        await (await admin.DeleteAsync("/api/marcas/999999")).AssertEstadoAsync(HttpStatusCode.NotFound);

        await admin.CrearIdAsync("/api/modelos", new { idMarca = marca, descripcion = "En uso" });
        await (await admin.DeleteAsync($"/api/marcas/{marca}")).AssertEstadoAsync(HttpStatusCode.Conflict);
        await (await admin.PostAsJsonAsync("/api/modelos", new { idMarca = 999999, descripcion = "Huérfano" }))
            .AssertEstadoAsync(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Carga_de_imagen_valida_y_rechaza_contenido_falso()
    {
        var admin = await api.AdminAsync();
        var vehiculo = await Datos.CrearVehiculoAsync(admin);

        using var falso = new MultipartFormDataContent();
        var bytesFalsos = new ByteArrayContent("esto no es una imagen"u8.ToArray());
        bytesFalsos.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        falso.Add(bytesFalsos, "imagen", "falsa.png");
        await (await admin.PostAsync($"/api/vehiculos/{vehiculo}/imagen", falso)).AssertEstadoAsync(HttpStatusCode.BadRequest);

        using var valido = new MultipartFormDataContent();
        var png = new ByteArrayContent(AlmacenImagenesTests.Png(320, 200));
        png.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        valido.Add(png, "imagen", "auto.png");
        var respuesta = await (await admin.PostAsync($"/api/vehiculos/{vehiculo}/imagen", valido)).LeerAsync<JsonElement>();
        var url = respuesta.GetProperty("imagenUrl").GetString()!;

        Assert.StartsWith("/vehiculos/", url);
        var archivo = Path.Combine(api.CarpetaImagenes, "wwwroot", "vehiculos", Path.GetFileName(url));
        Assert.True(File.Exists(archivo));

        // La edición del vehículo no puede redirigir la imagen a otra ruta.
        var actual = await (await admin.GetAsync($"/api/vehiculos/{vehiculo}")).LeerAsync<JsonElement>();
        var cambio = JsonSerializer.Deserialize<Dictionary<string, object?>>(actual.GetRawText())!;
        cambio["imagenUrl"] = "/vehiculos/../../appsettings.json";
        await (await admin.PutAsJsonAsync($"/api/vehiculos/{vehiculo}", cambio)).AssertEstadoAsync(HttpStatusCode.NoContent);
        var despues = await (await admin.GetAsync($"/api/vehiculos/{vehiculo}")).LeerAsync<JsonElement>();
        Assert.Equal(url, despues.GetProperty("imagenUrl").GetString());

        // Eliminar el vehículo elimina también su archivo.
        await (await admin.DeleteAsync($"/api/vehiculos/{vehiculo}")).AssertEstadoAsync(HttpStatusCode.NoContent);
        Assert.False(File.Exists(archivo));
    }

    [Fact]
    public async Task Errores_de_sql_server_se_traducen_a_respuestas_http_claras()
    {
        await using var db = api.CrearDbContext();
        var cedula = Datos.Cedula();
        db.Clientes.Add(new Cliente { Nombre = "Directo 1", Cedula = cedula, TipoPersona = "Fisica", Estado = true });
        await db.SaveChangesAsync();

        db.Clientes.Add(new Cliente { Nombre = "Directo 2", Cedula = cedula, TipoPersona = "Fisica", Estado = true });
        var duplicado = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal(409, DbExceptionHandler.Clasificar(duplicado).Estado);
        db.ChangeTracker.Clear();

        db.Rentas.Add(new Renta
        {
            IdEmpleado = 999_999, IdCliente = 999_999, IdVehiculo = 999_999, FechaRenta = DateTime.Today,
            MontoXdia = 1, CantidadDias = 1, Estado = "Activa"
        });
        var huerfana = await Assert.ThrowsAsync<DbUpdateException>(() => db.SaveChangesAsync());
        Assert.Equal(409, DbExceptionHandler.Clasificar(huerfana).Estado);
    }

    [Fact]
    public async Task El_esquema_coincide_con_el_modelo_y_no_hay_migraciones_pendientes()
    {
        await using var db = api.CrearDbContext();
        Assert.Empty(await db.Database.GetPendingMigrationsAsync());
        Assert.False(db.Database.HasPendingModelChanges(),
            "El modelo de EF Core tiene cambios sin migración: el snapshot no coincide con RentCarDbContext.");
    }
}
