using System.Text.RegularExpressions;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;

namespace RentCar.API.Infrastructure;

/// <summary>
/// Almacenamiento seguro de imágenes de vehículos en wwwroot/vehiculos.
///
/// Defensa en profundidad:
/// 1. Límite de tamaño de archivo y extensión permitida.
/// 2. Firma binaria (magic bytes) coherente con la extensión.
/// 3. Identificación del formato real y de las dimensiones sin decodificar píxeles
///    (rechaza dimensiones abusivas antes de reservar memoria).
/// 4. Decodificación completa con ImageSharp: un archivo malformado no se acepta.
/// 5. Re-codificación sin metadatos (EXIF/GPS, ICC, IPTC, XMP).
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

    private static readonly Dictionary<string, string[]> FormatosPorExtension = new(StringComparer.OrdinalIgnoreCase)
    {
        [".jpg"] = ["JPEG"],
        [".jpeg"] = ["JPEG"],
        [".png"] = ["PNG"],
        [".webp"] = ["Webp"]
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
        if (!FormatosPorExtension.TryGetValue(extension, out var formatosEsperados))
            return Fallo("Formato no permitido. Usa JPG, JPEG, PNG o WEBP.");

        await using var memoria = new MemoryStream((int)archivo.Length);
        await archivo.CopyToAsync(memoria, cancellationToken);
        var bytes = memoria.ToArray();

        if (!FirmaValida(bytes, extension))
            return Fallo("El contenido del archivo no coincide con una imagen permitida.");

        var opciones = new DecoderOptions { MaxFrames = 1 };
        ImageInfo info;
        try
        {
            info = Image.Identify(opciones, bytes);
        }
        catch (Exception ex) when (ex is ImageFormatException or NotSupportedException)
        {
            return Fallo("El archivo está dañado o no es una imagen válida.");
        }

        if (info.Metadata.DecodedImageFormat is null ||
            !formatosEsperados.Contains(info.Metadata.DecodedImageFormat.Name, StringComparer.OrdinalIgnoreCase))
            return Fallo("La extensión del archivo no corresponde a su contenido real.");

        if (info.Width > DimensionMaxima || info.Height > DimensionMaxima)
            return Fallo($"La imagen supera las dimensiones máximas permitidas ({DimensionMaxima}×{DimensionMaxima} px).");
        if (info.Width < DimensionMinima || info.Height < DimensionMinima)
            return Fallo($"La imagen es demasiado pequeña (mínimo {DimensionMinima}×{DimensionMinima} px).");

        Directory.CreateDirectory(Carpeta);
        var nombre = $"{Guid.NewGuid():N}{(extension == ".jpeg" ? ".jpg" : extension)}";
        var destino = Path.Combine(Carpeta, nombre);
        var temporal = Path.Combine(Carpeta, $".{Guid.NewGuid():N}.tmp");

        try
        {
            using var imagen = Image.Load(opciones, bytes);
            imagen.Metadata.ExifProfile = null;
            imagen.Metadata.IccProfile = null;
            imagen.Metadata.IptcProfile = null;
            imagen.Metadata.XmpProfile = null;

            IImageEncoder encoder = extension switch
            {
                ".png" => new PngEncoder(),
                ".webp" => new WebpEncoder { Quality = 85 },
                _ => new JpegEncoder { Quality = 85 }
            };

            await imagen.SaveAsync(temporal, encoder, cancellationToken);
            File.Move(temporal, destino, overwrite: false);
            return new Resultado(true, nombre, null);
        }
        catch (Exception ex) when (ex is ImageFormatException or NotSupportedException)
        {
            return Fallo("El archivo está dañado o no es una imagen válida.");
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
