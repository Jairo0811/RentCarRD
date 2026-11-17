using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace RentCar.API.Infrastructure;

/// <summary>
/// Traduce errores de persistencia a respuestas HTTP comprensibles en lugar de un 500 genérico.
/// La validación previa en los controladores sigue siendo la primera línea; este manejador
/// cubre las condiciones de carrera que solo la base de datos puede detectar.
/// </summary>
public sealed class DbExceptionHandler(ILogger<DbExceptionHandler> logger, IProblemDetailsService problemDetails)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (estado, titulo, detalle) = Clasificar(exception);
        if (estado is null)
        {
            return false;
        }

        logger.LogWarning(exception, "Conflicto de persistencia traducido a HTTP {Estado}", estado);
        httpContext.Response.StatusCode = estado.Value;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = new ProblemDetails
            {
                Status = estado,
                Title = titulo,
                Detail = detalle
            }
        });
    }

    public static (int? Estado, string Titulo, string Detalle) Clasificar(Exception exception)
    {
        if (exception is DbUpdateConcurrencyException)
        {
            return (StatusCodes.Status409Conflict, "Conflicto de concurrencia",
                "El registro fue modificado por otra operación al mismo tiempo. Actualice la información e intente nuevamente.");
        }

        if (exception is DbUpdateException { InnerException: SqlException sql })
        {
            return sql.Number switch
            {
                2601 or 2627 => (StatusCodes.Status409Conflict, "Registro duplicado",
                    "Ya existe un registro con los mismos datos únicos (documento, usuario, placa o renta activa del vehículo)."),
                547 => (StatusCodes.Status409Conflict, "Restricción de integridad",
                    "La operación viola una relación con otros registros (por ejemplo, el registro está en uso o una referencia no existe)."),
                2628 or 8152 => (StatusCodes.Status400BadRequest, "Valor demasiado largo",
                    "Uno de los valores supera la longitud permitida."),
                _ => (null, string.Empty, string.Empty)
            };
        }

        return (null, string.Empty, string.Empty);
    }
}
