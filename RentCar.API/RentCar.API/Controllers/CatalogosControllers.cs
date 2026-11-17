using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.API.Domain;
using RentCar.API.Dtos;
using RentCar.API.Models;

namespace RentCar.API.Controllers;

/// <summary>
/// Comportamiento común de catálogos: consulta para cualquier usuario autenticado,
/// escritura solo para Admin, descripción obligatoria y única (sin distinguir mayúsculas),
/// 404 consistente y eliminación bloqueada (409) cuando el registro está en uso.
/// </summary>
[ApiController]
public abstract class CatalogoSimpleController<T>(RentCarDbContext context) : ControllerBase
    where T : class, ICatalogo, new()
{
    protected RentCarDbContext Context { get; } = context;

    protected abstract string NombreSingular { get; }

    protected abstract Task<string?> MotivoEnUso(int id, CancellationToken cancellationToken);

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CatalogoResponse>>> Listar(CancellationToken cancellationToken) =>
        Ok(await Context.Set<T>().AsNoTracking()
            .OrderBy(c => c.Descripcion)
            .Select(c => new CatalogoResponse(c.Id, c.Descripcion, c.Estado))
            .ToListAsync(cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CatalogoResponse>> Obtener(int id, CancellationToken cancellationToken)
    {
        var item = await Context.Set<T>().AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        return item is null
            ? NotFound($"{NombreSingular} no existe.")
            : Ok(new CatalogoResponse(item.Id, item.Descripcion, item.Estado));
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<CatalogoResponse>> Crear(CatalogoRequest request, CancellationToken cancellationToken)
    {
        var descripcion = request.Descripcion?.Trim() ?? string.Empty;
        if (descripcion.Length == 0)
            return BadRequest("La descripción es obligatoria.");
        if (await Context.Set<T>().AnyAsync(c => c.Descripcion == descripcion, cancellationToken))
            return Conflict($"Ya existe un registro con la descripción '{descripcion}'.");

        var item = new T { Descripcion = descripcion, Estado = request.Estado ?? true };
        Context.Set<T>().Add(item);
        await Context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Obtener), new { id = item.Id }, new CatalogoResponse(item.Id, item.Descripcion, item.Estado));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Actualizar(int id, CatalogoRequest request, CancellationToken cancellationToken)
    {
        var item = await Context.Set<T>().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (item is null)
            return NotFound($"{NombreSingular} no existe.");

        var descripcion = request.Descripcion?.Trim() ?? string.Empty;
        if (descripcion.Length == 0)
            return BadRequest("La descripción es obligatoria.");
        if (await Context.Set<T>().AnyAsync(c => c.Descripcion == descripcion && c.Id != id, cancellationToken))
            return Conflict($"Ya existe otro registro con la descripción '{descripcion}'.");

        item.Descripcion = descripcion;
        item.Estado = request.Estado ?? item.Estado;
        await Context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        var item = await Context.Set<T>().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
        if (item is null)
            return NotFound($"{NombreSingular} no existe.");

        var motivo = await MotivoEnUso(id, cancellationToken);
        if (motivo is not null)
            return Conflict(motivo);

        Context.Set<T>().Remove(item);
        await Context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

[Route("api/[controller]")]
public sealed class MarcasController(RentCarDbContext context) : CatalogoSimpleController<Marca>(context)
{
    protected override string NombreSingular => "La marca solicitada";

    protected override async Task<string?> MotivoEnUso(int id, CancellationToken cancellationToken)
    {
        if (await Context.Modelos.AnyAsync(m => m.IdMarca == id, cancellationToken))
            return "No se puede eliminar la marca porque tiene modelos asociados. Puede inactivarla.";
        if (await Context.Vehiculos.AnyAsync(v => v.IdMarca == id, cancellationToken))
            return "No se puede eliminar la marca porque hay vehículos que la utilizan. Puede inactivarla.";
        return null;
    }
}

[Route("api/[controller]")]
public sealed class TiposVehiculosController(RentCarDbContext context) : CatalogoSimpleController<TiposVehiculo>(context)
{
    protected override string NombreSingular => "El tipo de vehículo solicitado";

    protected override async Task<string?> MotivoEnUso(int id, CancellationToken cancellationToken) =>
        await Context.Vehiculos.AnyAsync(v => v.IdTipoVehiculo == id, cancellationToken)
            ? "No se puede eliminar el tipo de vehículo porque hay vehículos que lo utilizan. Puede inactivarlo."
            : null;
}

[Route("api/[controller]")]
public sealed class TiposCombustiblesController(RentCarDbContext context) : CatalogoSimpleController<TiposCombustible>(context)
{
    protected override string NombreSingular => "El tipo de combustible solicitado";

    protected override async Task<string?> MotivoEnUso(int id, CancellationToken cancellationToken) =>
        await Context.Vehiculos.AnyAsync(v => v.IdTipoCombustible == id || v.IdCombustible == id, cancellationToken)
            ? "No se puede eliminar el tipo de combustible porque hay vehículos que lo utilizan. Puede inactivarlo."
            : null;
}

/// <summary>Modelos: igual que los catálogos simples, pero vinculados a una marca existente.</summary>
[Route("api/[controller]")]
[ApiController]
public sealed class ModelosController(RentCarDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ModeloResponse>>> Listar(CancellationToken cancellationToken) =>
        Ok(await context.Modelos.AsNoTracking()
            .OrderBy(m => m.Descripcion)
            .Select(m => new ModeloResponse(m.Id, m.IdMarca, m.Descripcion, m.Estado))
            .ToListAsync(cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<ModeloResponse>> Obtener(int id, CancellationToken cancellationToken)
    {
        var m = await context.Modelos.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        return m is null ? NotFound("El modelo solicitado no existe.") : Ok(new ModeloResponse(m.Id, m.IdMarca, m.Descripcion, m.Estado));
    }

    [HttpPost]
    [Authorize(Roles = Roles.Admin)]
    public async Task<ActionResult<ModeloResponse>> Crear(ModeloRequest request, CancellationToken cancellationToken)
    {
        var error = await Validar(request, idActual: null, cancellationToken);
        if (error is not null)
            return error;

        var modelo = new Modelo { IdMarca = request.IdMarca, Descripcion = request.Descripcion!.Trim(), Estado = request.Estado ?? true };
        context.Modelos.Add(modelo);
        await context.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Obtener), new { id = modelo.Id },
            new ModeloResponse(modelo.Id, modelo.IdMarca, modelo.Descripcion, modelo.Estado));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Actualizar(int id, ModeloRequest request, CancellationToken cancellationToken)
    {
        var modelo = await context.Modelos.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (modelo is null)
            return NotFound("El modelo solicitado no existe.");

        var error = await Validar(request, id, cancellationToken);
        if (error is not null)
            return error;

        if (modelo.IdMarca != request.IdMarca &&
            await context.Vehiculos.AnyAsync(v => v.IdModelo == id, cancellationToken))
            return Conflict("No se puede cambiar la marca de un modelo que ya utilizan vehículos registrados.");

        modelo.IdMarca = request.IdMarca;
        modelo.Descripcion = request.Descripcion!.Trim();
        modelo.Estado = request.Estado ?? modelo.Estado;
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = Roles.Admin)]
    public async Task<IActionResult> Eliminar(int id, CancellationToken cancellationToken)
    {
        var modelo = await context.Modelos.FirstOrDefaultAsync(m => m.Id == id, cancellationToken);
        if (modelo is null)
            return NotFound("El modelo solicitado no existe.");
        if (await context.Vehiculos.AnyAsync(v => v.IdModelo == id, cancellationToken))
            return Conflict("No se puede eliminar el modelo porque hay vehículos que lo utilizan. Puede inactivarlo.");

        context.Modelos.Remove(modelo);
        await context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<ActionResult?> Validar(ModeloRequest request, int? idActual, CancellationToken cancellationToken)
    {
        var descripcion = request.Descripcion?.Trim() ?? string.Empty;
        if (descripcion.Length == 0)
            return BadRequest("La descripción es obligatoria.");
        if (!await context.Marcas.AnyAsync(m => m.Id == request.IdMarca, cancellationToken))
            return BadRequest("La marca seleccionada no existe.");
        if (await context.Modelos.AnyAsync(m => m.IdMarca == request.IdMarca && m.Descripcion == descripcion && m.Id != idActual, cancellationToken))
            return Conflict("Ya existe un modelo con esa descripción para la marca seleccionada.");
        return null;
    }
}
