using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace RentCar.API.Tests.Integration;

[Collection(ColeccionApi.Nombre)]
public class SeguridadTests(RentCarApiFactory api)
{
    [Fact]
    public async Task Login_correcto_devuelve_token_rol_y_empleado()
    {
        var respuesta = await api.CreateClient().PostAsJsonAsync("/api/auth/login",
            new { usuario = "ADMIN ", password = RentCarApiFactory.AdminPassword });

        var login = await respuesta.LeerAsync<RentCarApiFactory.LoginDto>();
        Assert.Equal("Admin", login.Rol);
        Assert.NotNull(login.EmpleadoId);
        Assert.False(string.IsNullOrWhiteSpace(login.AccessToken));
        Assert.True(login.ExpiresAtUtc > DateTime.UtcNow);
    }

    [Theory]
    [InlineData("admin", "ContraseñaIncorrecta1")]
    [InlineData("usuario-inexistente", "Cualquiera2026")]
    public async Task Login_incorrecto_devuelve_401(string usuario, string password)
    {
        var respuesta = await api.CreateClient().PostAsJsonAsync("/api/auth/login", new { usuario, password });
        await respuesta.AssertEstadoAsync(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Sin_token_los_endpoints_protegidos_devuelven_401_y_health_es_publico()
    {
        var cliente = api.CreateClient();
        await (await cliente.GetAsync("/api/rentas")).AssertEstadoAsync(HttpStatusCode.Unauthorized);
        await (await cliente.GetAsync("/health")).AssertEstadoAsync(HttpStatusCode.OK);
    }

    [Fact]
    public async Task Empleado_no_accede_a_recursos_administrativos()
    {
        var admin = await api.AdminAsync();
        var (_, usuario, password) = await Datos.CrearEmpleadoAsync(admin);
        var empleado = await api.ClienteAutenticadoAsync(usuario, password);

        await (await empleado.GetAsync("/api/empleados")).AssertEstadoAsync(HttpStatusCode.Forbidden);
        await (await empleado.GetAsync("/api/inspecciones")).AssertEstadoAsync(HttpStatusCode.Forbidden);
        await (await empleado.PostAsJsonAsync("/api/marcas", new { descripcion = "Intento" })).AssertEstadoAsync(HttpStatusCode.Forbidden);
        await (await empleado.PostAsJsonAsync("/api/vehiculos", new { descripcion = "Intento" })).AssertEstadoAsync(HttpStatusCode.Forbidden);
        await (await empleado.DeleteAsync("/api/clientes/1")).AssertEstadoAsync(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task Empleado_puede_operar_rentas_sin_consultar_el_listado_de_empleados()
    {
        var admin = await api.AdminAsync();
        var (id, usuario, password) = await Datos.CrearEmpleadoAsync(admin);
        var empleado = await api.ClienteAutenticadoAsync(usuario, password);

        var perfil = await (await empleado.GetAsync("/api/auth/me")).LeerAsync<JsonElement>();
        Assert.Equal(id, perfil.GetProperty("empleadoId").GetInt32());
        Assert.Equal("Empleado", perfil.GetProperty("rol").GetString());

        // Todos los datos que necesita el módulo de rentas son accesibles para el rol Empleado.
        foreach (var url in new[] { "/api/rentas", "/api/vehiculos", "/api/clientes", "/api/marcas", "/api/modelos" })
        {
            await (await empleado.GetAsync(url)).AssertEstadoAsync(HttpStatusCode.OK);
        }

        // Y las rentas incluyen el nombre del empleado responsable.
        var vehiculo = await Datos.CrearVehiculoAsync(admin);
        var cliente = await Datos.CrearClienteAsync(empleado);
        var renta = await (await empleado.PostAsJsonAsync("/api/rentas", new
        {
            idVehiculo = vehiculo, idCliente = cliente, fechaRenta = DateTime.Today, montoXDia = 1000, cantidadDias = 1
        })).LeerAsync<JsonElement>();
        Assert.Equal($"Empleado {usuario}", renta.GetProperty("nombreEmpleado").GetString());
    }

    [Fact]
    public async Task Renta_se_atribuye_al_empleado_del_token_aunque_el_json_indique_otro()
    {
        var admin = await api.AdminAsync();
        var adminId = (await (await admin.GetAsync("/api/auth/me")).LeerAsync<JsonElement>()).GetProperty("empleadoId").GetInt32();
        var (empleadoId, usuario, password) = await Datos.CrearEmpleadoAsync(admin);
        var empleado = await api.ClienteAutenticadoAsync(usuario, password);

        var vehiculo = await Datos.CrearVehiculoAsync(admin);
        var cliente = await Datos.CrearClienteAsync(admin);

        // Intento de suplantación: el empleado envía el id del administrador.
        var respuesta = await empleado.PostAsJsonAsync("/api/rentas", new
        {
            idEmpleado = adminId,
            idVehiculo = vehiculo,
            idCliente = cliente,
            fechaRenta = DateTime.Today,
            montoXDia = 1500,
            cantidadDias = 2
        });

        var renta = await respuesta.LeerAsync<JsonElement>();
        Assert.Equal(empleadoId, renta.GetProperty("idEmpleado").GetInt32());
        Assert.NotEqual(adminId, renta.GetProperty("idEmpleado").GetInt32());
    }

    [Fact]
    public async Task Empleado_inactivado_pierde_el_acceso_aunque_su_token_no_haya_expirado()
    {
        var admin = await api.AdminAsync();
        var (id, usuario, password) = await Datos.CrearEmpleadoAsync(admin);
        var empleado = await api.ClienteAutenticadoAsync(usuario, password);
        await (await empleado.GetAsync("/api/rentas")).AssertEstadoAsync(HttpStatusCode.OK);

        var datos = await (await admin.GetAsync($"/api/empleados/{id}")).LeerAsync<JsonElement>();
        var actualizacion = JsonSerializer.Deserialize<Dictionary<string, object?>>(datos.GetRawText())!;
        actualizacion["estado"] = false;
        await (await admin.PutAsJsonAsync($"/api/empleados/{id}", actualizacion)).AssertEstadoAsync(HttpStatusCode.NoContent);

        await (await empleado.GetAsync("/api/rentas")).AssertEstadoAsync(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Respuestas_de_empleados_nunca_exponen_hash_de_contrasena()
    {
        var admin = await api.AdminAsync();
        await Datos.CrearEmpleadoAsync(admin);
        var json = await (await admin.GetAsync("/api/empleados")).Content.ReadAsStringAsync();

        Assert.DoesNotContain("passwordHash", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("AQAAAA", json); // prefijo de los hashes de PasswordHasher v3
    }

    [Fact]
    public async Task La_cuenta_admin_no_puede_renombrarse_ni_inactivarse()
    {
        var admin = await api.AdminAsync();
        var adminId = (await (await admin.GetAsync("/api/auth/me")).LeerAsync<JsonElement>()).GetProperty("empleadoId").GetInt32();
        var datos = await (await admin.GetAsync($"/api/empleados/{adminId}")).LeerAsync<JsonElement>();
        var cambio = JsonSerializer.Deserialize<Dictionary<string, object?>>(datos.GetRawText())!;

        cambio["usuario"] = "otro.admin";
        await (await admin.PutAsJsonAsync($"/api/empleados/{adminId}", cambio)).AssertEstadoAsync(HttpStatusCode.Conflict);

        cambio["usuario"] = "admin";
        cambio["estado"] = false;
        await (await admin.PutAsJsonAsync($"/api/empleados/{adminId}", cambio)).AssertEstadoAsync(HttpStatusCode.Conflict);
    }
}
