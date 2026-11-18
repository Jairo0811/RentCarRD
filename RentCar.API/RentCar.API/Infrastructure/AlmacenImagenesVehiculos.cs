using System.Text.RegularExpressions;

namespace RentCar.API.Infrastructure;

/// <summary>
/// Almacenamiento seguro de imágenes de vehículos en wwwroot/vehiculos.
///
/// Defensa en profundidad:
/// 1. Límite de tamaño de archivo y extensión permitida.
/// 2. Firma binaria (magic bytes) coherente con la extensión.
/// 3. Análisis estructural completo del formato real (ValidadorImagenes): CRC y flujo zlib en PNG,
///    segmentos JPEG, chunks RIFF/WebP. Un archivo truncado, malformado, animado o con datos
///    añadidos no se acepta. Las dimensiones se leen de la cabecera antes de procesar nada más.
/// 4. Límites de dimensiones mínimas y máximas.
/// 5. Eliminación de metadatos (EXIF/GPS, XMP, IPTC, ICC, comentarios y textos).
/// 6. Nombre generado por el servidor (GUID); nunca se usa el nombre o ruta del cliente.
/// 7. Escritura en archivo temporal y movimiento atómico; las eliminaciones solo aceptan
///    nombres con el patrón generado y nunca salen de la carpeta de imágenes.
/// </summary>
public sealed partial class AlmacenImagenesVehiculos(IWebHostEnvironment environment)
{
    public const long TamanoMaximoBytes = 5 * 1024 * 1024;
    public const int DimensionMaxima = 4096;
    public const int DimensionMinima = 32;
    public const string PrefijoUrl = "/vehiculos/";

    private static readonly Dictionary<string, string> FormatoPorExtension = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = "JPEG",
        [".jpeg"] = "JPEG",
        [".png"] = "PNG",
        [".webp"] = "WEBP"
    };

    public string Carpeta
    {
        get
        {
            var raiz = string.IsNullOrWhiteSpace(environment.WebRootPath)
                ? Path.Combine(environment.ContentRootPath, "wwwroot")
                : environment.WebRootPath;
            return Path.Combine(raiz, "vehiculos");
        }
    }

    public sealed record Resultado(bool Exito, string? NombreArchivo, string? Error);

    public async Task<Resultado> GuardarAsync(IFormFile archivo, CancellationToken cancellationToken)
    {
        if (archivo.Length == 0)
            return Fallo("No se recibió ninguna imagen.");
        if (archivo.Length > TamanoMaximoBytes)
            return Fallo("La imagen no puede superar los 5 MB.");

        var extension = Path.GetExtension(archivo.FileName).ToLowerInvariant();
        if (!FormatoPorExtension.TryGetValue(extension, out var formatoEsperado))
            return Fallo("Formato no permitido. Usa JPG, JPEG, PNG o WEBP.");

        await using var memoria = new MemoryStream((int)archivo.Length);
        await archivo.CopyToAsync(memoria, cancellationToken);
        var bytes = memoria.ToArray();

        if (!FirmaValida(bytes, extension))
            return Fallo("El contenido del archivo no coincide con una imagen permitida.");

        var analisis = ValidadorImagenes.Analizar(bytes);
        if (!analisis.Exito)
            return Fallo(analisis.Error!);

        if (analisis.Formato != formatoEsperado)
            return Fallo("La extensión del archivo no corresponde a su contenido real.");

        if (analisis.Ancho > DimensionMaxima || analisis.Alto > DimensionMaxima)
            return Fallo($"La imagen supera las dimensiones máximas permitidas ({DimensionMaxima}×{DimensionMaxima} px).");
        if (analisis.Ancho < DimensionMinima || analisis.Alto < DimensionMinima)
            return Fallo($"La imagen es demasiado pequeña (mínimo {DimensionMinima}×{DimensionMinima} px).");

        Directory.CreateDirectory(Carpeta);
        var nombre = $"{Guid.NewGuid():N}{(extension == ".jpeg" ? ".jpg" : extension)}";
        var destino = Path.Combine(Carpeta, nombre);
        var temporal = Path.Combine(Carpeta, $".{Guid.NewGuid():N}.tmp");

        try
        {
            // Se escribe la versión limpia (sin metadatos), nunca los bytes originales.
            await File.WriteAllBytesAsync(temporal, analisis.Contenido!, cancellationToken);
            File.Move(temporal, destino, overwrite: false);
            return new Resultado(true, nombre, null);
        }
        finally
        {
            if (File.Exists(temporal))
            {
                File.Delete(temporal);
            }
        }
    }

    /// <summary>Elimina una imagen previamente generada por el servidor. Ignora cualquier otro valor.</summary>
    public void Eliminar(string? urlONombre)
    {
        if (string.IsNullOrWhiteSpace(urlONombre))
            return;

        var nombre = Path.GetFileName(urlONombre);
        if (!NombreGenerado().IsMatch(nombre))
            return;

        var ruta = Path.GetFullPath(Path.Combine(Carpeta, nombre));
        var carpeta = Path.GetFullPath(Carpeta) + Path.DirectorySeparatorChar;
        if (ruta.StartsWith(carpeta, StringComparison.Ordinal) && File.Exists(ruta))
        {
            File.Delete(ruta);
        }
    }

    public static string Url(string nombreArchivo) => $"{PrefijoUrl}{nombreArchivo}";

    internal static bool FirmaValida(ReadOnlySpan<byte> bytes, string extension)
    {
        if (bytes.Length < 12)
            return false;

        return extension switch
        {
            ".jpg" or ".jpeg" => bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
            ".png" => bytes[..8].SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            ".webp" => bytes[..4].SequenceEqual("RIFF"u8) && bytes.Slice(8, 4).SequenceEqual("WEBP"u8),
            _ => false
        };
    }

    private static Resultado Fallo(string error) => new(false, null, error);

    [GeneratedRegex("^([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\\.(jpg|jpeg|png|webp)$")]
    private static partial Regex NombreGenerado();
}
