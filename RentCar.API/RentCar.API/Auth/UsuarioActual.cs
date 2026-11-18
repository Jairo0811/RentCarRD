using System.Globalization;
using System.Security.Claims;
using RentCar.API.Domain;

namespace RentCar.API.Auth;

public static class UsuarioActual
{
    /// <summary>
    /// Id del empleado autenticado según el claim firmado "empleado_id" del JWT.
    /// Es la única fuente válida para atribuir operaciones (rentas, inspecciones):
    /// nunca se toma de un campo enviado por el cliente.
    /// </summary>
    public static int? EmpleadoId(this ClaimsPrincipal usuario)
    {
        var valor = usuario.FindFirstValue(ClaimsRentCar.EmpleadoId);
        return int.TryParse(valor, NumberStyles.None, CultureInfo.InvariantCulture, out var id) && id > 0
            ? id
            : null;
    }
}
