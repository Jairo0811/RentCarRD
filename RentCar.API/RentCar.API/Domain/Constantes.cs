namespace RentCar.API.Domain;

public static class Roles
{
    public const string Admin = "Admin";
    public const string Empleado = "Empleado";

    /// <summary>
    /// Regla académica heredada de v1.2: el rol se deriva del usuario. La cuenta "admin"
    /// es la única administradora; el resto de cuentas activas son empleados.
    /// </summary>
    public const string UsuarioAdministrador = "admin";

    public static string ParaUsuario(string usuario) =>
        string.Equals(usuario, UsuarioAdministrador, StringComparison.OrdinalIgnoreCase) ? Admin : Empleado;
}

public static class ClaimsRentCar
{
    public const string EmpleadoId = "empleado_id";
}

public static class EstadosRenta
{
    public const string Activa = "Activa";
    public const string Concluida = "Concluida";
}

public static class EstadosVehiculo
{
    public const string Disponible = "Disponible";
    public const string Rentado = "Rentado";
    public const string NoDisponible = "NoDisponible";

    public static readonly string[] Todos = [Disponible, Rentado, NoDisponible];
}

public static class TandasLaborales
{
    public static readonly string[] Todas = ["Matutina", "Vespertina", "Nocturna"];
}

public static class NivelesCombustible
{
    public static readonly string[] Todos = ["1/4", "1/2", "3/4", "Lleno"];
}

public static class TiposPersona
{
    public const string Fisica = "Fisica";
    public const string Juridica = "Juridica";
}

public static class MarcasTarjeta
{
    public static readonly string[] Todas = ["VISA", "MASTERCARD", "AMEX", "DISCOVER"];
}
