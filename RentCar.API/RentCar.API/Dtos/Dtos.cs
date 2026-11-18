using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace RentCar.API.Dtos;

// DTOs de entrada y salida. Evitan la sobreasignación (mass assignment): el cliente solo
// puede enviar los campos previstos y las respuestas nunca exponen hashes ni datos de pago.

#region Autenticación

public sealed record PerfilActualResponse(int EmpleadoId, string Nombre, string Usuario, string Rol);

#endregion

#region Rentas

/// <summary>
/// Solicitud de renta. No incluye IdEmpleado: el servidor atribuye la renta al empleado
/// autenticado (claim empleado_id). Cualquier "idEmpleado" enviado en el JSON se ignora.
/// </summary>
public sealed class CrearRentaRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un vehículo válido.")]
    public int IdVehiculo { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un cliente válido.")]
    public int IdCliente { get; set; }

    [Required(ErrorMessage = "Debe indicar una fecha de renta válida.")]
    public DateTime? FechaRenta { get; set; }

    [JsonPropertyName("montoXDia")]
    [Range(typeof(decimal), "0.01", "1000000", ErrorMessage = "El monto por día debe estar entre RD$ 0.01 y RD$ 1,000,000.", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true)]
    public decimal MontoXDia { get; set; }

    [Range(1, 365, ErrorMessage = "La cantidad de días debe estar entre 1 y 365.")]
    public int CantidadDias { get; set; }

    [StringLength(1000, ErrorMessage = "El comentario no puede superar 1000 caracteres.")]
    public string? Comentario { get; set; }
}

public sealed class ActualizarRentaRequest
{
    [JsonPropertyName("montoXDia")]
    [Range(typeof(decimal), "0.01", "1000000", ErrorMessage = "El monto por día debe estar entre RD$ 0.01 y RD$ 1,000,000.", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true)]
    public decimal MontoXDia { get; set; }

    [Range(1, 365, ErrorMessage = "La cantidad de días debe estar entre 1 y 365.")]
    public int CantidadDias { get; set; }

    [StringLength(1000, ErrorMessage = "El comentario no puede superar 1000 caracteres.")]
    public string? Comentario { get; set; }
}

public sealed record RentaResponse(
    int NoRenta,
    int IdEmpleado,
    string NombreEmpleado,
    int IdVehiculo,
    int IdCliente,
    DateTime FechaRenta,
    DateTime FechaDevolucionPrevista,
    DateTime? FechaDevolucion,
    [property: JsonPropertyName("montoXDia")] decimal MontoXDia,
    int CantidadDias,
    decimal Subtotal,
    decimal Itbis,
    decimal Total,
    string Comentario,
    string Estado);

#endregion

#region Clientes

/// <summary>
/// Cliente. El método de pago es SIMULADO: solo se acepta la marca y cuatro dígitos de
/// referencia. No existen campos para número completo, titular, expiración ni CVV.
/// </summary>
public sealed class ClienteRequest
{
    [Required(ErrorMessage = "El nombre del cliente es obligatorio.")]
    [StringLength(150, ErrorMessage = "El nombre no puede superar 150 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "El documento es obligatorio.")]
    [StringLength(20)]
    public string Cedula { get; set; } = string.Empty;

    public string? TipoPersona { get; set; }

    [Range(typeof(decimal), "0", "999999999", ErrorMessage = "El límite de crédito debe estar entre 0 y 999,999,999.", ParseLimitsInInvariantCulture = true, ConvertValueInInvariantCulture = true)]
    public decimal LimiteCredito { get; set; }

    public bool Estado { get; set; } = true;

    public string? TipoTarjeta { get; set; }

    public string? UltimosDigitosTarjeta { get; set; }
}

public sealed record ClienteResponse(
    int Id,
    string Nombre,
    string Cedula,
    string TipoPersona,
    decimal LimiteCredito,
    bool Estado,
    string? TipoTarjeta,
    string? UltimosDigitosTarjeta);

#endregion

#region Empleados

public class EmpleadoBaseRequest
{
    [Required(ErrorMessage = "El nombre del empleado es obligatorio.")]
    [StringLength(150, ErrorMessage = "El nombre no puede superar 150 caracteres.")]
    public string Nombre { get; set; } = string.Empty;

    [Required(ErrorMessage = "La cédula es obligatoria.")]
    [StringLength(20)]
    public string Cedula { get; set; } = string.Empty;

    [Required(ErrorMessage = "La tanda laboral es obligatoria.")]
    public string TandaLabor { get; set; } = string.Empty;

    [Range(0, 100, ErrorMessage = "El porcentaje de comisión debe estar entre 0 y 100.")]
    public int PorcientoComision { get; set; }

    public DateTime? FechaIngreso { get; set; }

    public bool Estado { get; set; } = true;

    [Required(ErrorMessage = "El usuario de acceso es obligatorio.")]
    public string Usuario { get; set; } = string.Empty;
}

public sealed class CrearEmpleadoRequest : EmpleadoBaseRequest
{
    [Required(ErrorMessage = "La contraseña inicial es obligatoria.")]
    public string Password { get; set; } = string.Empty;
}

public sealed class ActualizarEmpleadoRequest : EmpleadoBaseRequest
{
    /// <summary>Opcional: solo se cambia la contraseña si se envía un valor.</summary>
    public string? Password { get; set; }
}

public sealed record EmpleadoResponse(
    int Id,
    string Nombre,
    string Cedula,
    string TandaLabor,
    int PorcientoComision,
    DateTime FechaIngreso,
    bool Estado,
    string Usuario,
    string Rol);

#endregion

#region Vehículos

/// <summary>
/// Vehículo. No incluye ImagenUrl (solo se modifica mediante POST /api/vehiculos/{id}/imagen)
/// ni permite fijar manualmente el estado "Rentado" (lo gestiona el flujo de rentas).
/// </summary>
public sealed class VehiculoRequest
{
    [Required(ErrorMessage = "La descripción del vehículo es obligatoria.")]
    [StringLength(200, ErrorMessage = "La descripción no puede superar 200 caracteres.")]
    public string? Descripcion { get; set; }

    public string? NoChasis { get; set; }
    public string? NoMotor { get; set; }
    public string? NoPlaca { get; set; }
    public int? IdTipoVehiculo { get; set; }
    public int? IdMarca { get; set; }
    public int? IdModelo { get; set; }
    public int? IdTipoCombustible { get; set; }

    /// <summary>Compatibilidad con el campo histórico duplicado; se sincroniza con IdTipoCombustible.</summary>
    public int? IdCombustible { get; set; }

    public string? EstadoOperacion { get; set; }
}

#endregion

#region Catálogos

public sealed class CatalogoRequest
{
    [Required(ErrorMessage = "La descripción es obligatoria.")]
    [StringLength(100, ErrorMessage = "La descripción no puede superar 100 caracteres.")]
    public string? Descripcion { get; set; }

    public bool? Estado { get; set; } = true;
}

public sealed class ModeloRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar una marca válida.")]
    public int IdMarca { get; set; }

    [Required(ErrorMessage = "La descripción es obligatoria.")]
    [StringLength(100, ErrorMessage = "La descripción no puede superar 100 caracteres.")]
    public string? Descripcion { get; set; }

    public bool? Estado { get; set; } = true;
}

public sealed record CatalogoResponse(int Id, string? Descripcion, bool? Estado);

public sealed record ModeloResponse(int Id, int? IdMarca, string? Descripcion, bool? Estado);

#endregion

#region Inspecciones

public sealed class InspeccionRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un vehículo válido.")]
    public int IdVehiculo { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un cliente válido.")]
    public int IdCliente { get; set; }

    public bool TieneRalladuras { get; set; }

    [Required(ErrorMessage = "El nivel de combustible es obligatorio.")]
    public string CantidadCombustible { get; set; } = string.Empty;

    public bool TieneGomaRespuesta { get; set; }
    public bool TieneGato { get; set; }
    public bool TieneRoturasCristal { get; set; }
    public bool GomaDelanteraDerecha { get; set; }
    public bool GomaDelanteraIzquierda { get; set; }
    public bool GomaTraseraDerecha { get; set; }
    public bool GomaTraseraIzquierda { get; set; }

    public DateTime? Fecha { get; set; }

    public bool Estado { get; set; } = true;
}

#endregion
