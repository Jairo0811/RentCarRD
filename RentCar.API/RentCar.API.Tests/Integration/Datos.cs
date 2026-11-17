using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace RentCar.API.Tests.Integration;

/// <summary>Generadores de datos únicos y válidos para que cada prueba sea independiente.</summary>
public static class Datos
{
    private static int _secuencia = Random.Shared.Next(100_000, 900_000);

    public static int Siguiente() => Interlocked.Increment(ref _secuencia);

    /// <summary>Cédula válida (dígito verificador correcto) y única en la ejecución.</summary>
    public static string Cedula()
    {
        var baseDiez = $"9{Siguiente():D9}";
        int[] pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
        var suma = 0;
        for (var i = 0; i < 10; i++)
        {
            var v = (baseDiez[i] - '0') * pesos[i];
            suma += v >= 10 ? (v / 10) + (v % 10) : v;
        }

        return baseDiez + ((10 - (suma % 10)) % 10);
    }

    /// <summary>RNC válido y único.</summary>
    public static string Rnc()
    {
        var baseOcho = $"4{Siguiente() % 10_000_000:D7}";
        int[] pesos = [7, 9, 8, 6, 5, 4, 3, 2];
        var suma = 0;
        for (var i = 0; i < 8; i++)
        {
            suma += (baseOcho[i] - '0') * pesos[i];
        }

        var resto = suma % 11;
        return baseOcho + (resto switch { 0 => 2, 1 => 1, _ => 11 - resto });
    }

    public static string Placa() => $"A{Siguiente() % 1_000_000:D6}";

    public static async Task<T> LeerAsync<T>(this HttpResponseMessage respuesta)
    {
        var contenido = await respuesta.Content.ReadAsStringAsync();
        Assert.True(respuesta.IsSuccessStatusCode, $"HTTP {(int)respuesta.StatusCode}: {contenido}");
        return JsonSerializer.Deserialize<T>(contenido, new JsonSerializerOptions(JsonSerializerDefaults.Web))!;
    }

    public static async Task<int> CrearIdAsync(this HttpClient cliente, string url, object cuerpo, string propiedadId = "id")
    {
        var respuesta = await cliente.PostAsJsonAsync(url, cuerpo);
        var json = await respuesta.LeerAsync<JsonElement>();
        return json.GetProperty(propiedadId).GetInt32();
    }

    public static async Task AssertEstadoAsync(this HttpResponseMessage respuesta, HttpStatusCode esperado)
    {
        var contenido = await respuesta.Content.ReadAsStringAsync();
        Assert.True(respuesta.StatusCode == esperado,
            $"Se esperaba HTTP {(int)esperado} y se obtuvo {(int)respuesta.StatusCode}: {contenido}");
    }

    /// <summary>Crea marca, modelo, tipo y combustible y devuelve un vehículo Disponible.</summary>
    public static async Task<int> CrearVehiculoAsync(HttpClient admin, string? placa = null)
    {
        var n = Siguiente();
        var marca = await admin.CrearIdAsync("/api/marcas", new { descripcion = $"Marca {n}" });
        var modelo = await admin.CrearIdAsync("/api/modelos", new { idMarca = marca, descripcion = $"Modelo {n}" });
        var tipo = await admin.CrearIdAsync("/api/tiposvehiculos", new { descripcion = $"Tipo {n}" });
        var combustible = await admin.CrearIdAsync("/api/tiposcombustibles", new { descripcion = $"Combustible {n}" });

        return await admin.CrearIdAsync("/api/vehiculos", new
        {
            descripcion = $"Vehículo de prueba {n}",
            noPlaca = placa ?? Placa(),
            noChasis = $"CH{n}",
            noMotor = $"MT{n}",
            idMarca = marca,
            idModelo = modelo,
            idTipoVehiculo = tipo,
            idTipoCombustible = combustible,
            estadoOperacion = "Disponible"
        });
    }

    public static Task<int> CrearClienteAsync(HttpClient cliente) =>
        cliente.CrearIdAsync("/api/clientes", new
        {
            nombre = $"Cliente {Siguiente()}",
            cedula = Cedula(),
            tipoPersona = "Fisica",
            limiteCredito = 50000,
            estado = true
        });

    /// <summary>Crea un empleado (no administrador) y devuelve su id y credenciales.</summary>
    public static async Task<(int Id, string Usuario, string Password)> CrearEmpleadoAsync(HttpClient admin)
    {
        var usuario = $"empleado{Siguiente()}";
        const string password = "Empleado2026";
        var id = await admin.CrearIdAsync("/api/empleados", new
        {
            nombre = $"Empleado {usuario}",
            cedula = Cedula(),
            tandaLabor = "Matutina",
            porcientoComision = 5,
            estado = true,
            usuario,
            password
        });
        return (id, usuario, password);
    }
}
