namespace RentCar.API.Security;

public static class AppRoles
{
    public const string Administrador = "Administrador";
    public const string Empleado = "Empleado";
    public const string Operaciones = Administrador + "," + Empleado;

    public static bool IsValid(string? role) =>
        string.Equals(role, Administrador, StringComparison.OrdinalIgnoreCase) ||
        string.Equals(role, Empleado, StringComparison.OrdinalIgnoreCase);

    public static string Normalize(string? role) =>
        string.Equals(role, Administrador, StringComparison.OrdinalIgnoreCase)
            ? Administrador
            : Empleado;
}
