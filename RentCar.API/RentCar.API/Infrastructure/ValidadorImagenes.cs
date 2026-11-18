using System.Buffers.Binary;
using System.IO.Compression;

namespace RentCar.API.Infrastructure;

/// <summary>
/// Validación estructural y limpieza de imágenes PNG, JPEG y WebP sin dependencias externas.
///
/// v1.2.1 sustituye a SixLabors.ImageSharp: la única versión de ImageSharp sin vulnerabilidades
/// conocidas (3.2.0) exige una clave de licencia comercial en cada compilación, lo que no es
/// adecuado para un proyecto académico congelado. Este validador:
/// - recorre el formato completo (chunks PNG con CRC, segmentos JPEG, chunks RIFF/WebP) y
///   rechaza archivos truncados, con datos añadidos, chunks críticos desconocidos o animaciones;
/// - en PNG descomprime el flujo zlib de IDAT (sin interpretar píxeles) y comprueba que su
///   tamaño y los filtros por fila coinciden exactamente con las dimensiones declaradas, con un
///   límite que impide bombas de descompresión;
/// - obtiene las dimensiones reales de la cabecera de la imagen;
/// - elimina metadatos: EXIF/GPS, XMP, IPTC, ICC, comentarios y texto (tEXt/zTXt/iTXt).
/// No decodifica los píxeles JPEG/WebP; esos datos solo los interpreta el navegador del usuario.
/// </summary>
internal static class ValidadorImagenes
{
    public sealed record Resultado(string? Formato, int Ancho, int Alto, byte[]? Contenido, string? Error)
    {
        public bool Exito => Error is null;
    }

    private const string Danado = "El archivo está dañado o no es una imagen válida.";

    public static Resultado Analizar(byte[] datos) =>
        datos.Length >= 8 && datos.AsSpan(0, 8).SequenceEqual(FirmaPng) ? Png(datos)
        : datos.Length >= 3 && datos[0] == 0xFF && datos[1] == 0xD8 && datos[2] == 0xFF ? Jpeg(datos)
        : datos.Length >= 12 && datos.AsSpan(0, 4).SequenceEqual("RIFF"u8) && datos.AsSpan(8, 4).SequenceEqual("WEBP"u8) ? Webp(datos)
        : Fallo("El contenido del archivo no coincide con una imagen permitida.");

    private static Resultado Fallo(string error) => new(null, 0, 0, null, error);

    #region PNG

    private static ReadOnlySpan<byte> FirmaPng => [137, 80, 78, 71, 13, 10, 26, 10];

    /// <summary>Chunks auxiliares que se conservan: afectan a cómo se ve la imagen, no la describen.</summary>
    private static readonly HashSet<string> AuxiliaresPngPermitidos = ["tRNS", "gAMA", "cHRM", "sRGB", "bKGD", "sBIT", "pHYs"];

    private static Resultado Png(byte[] datos)
    {
        var salida = new MemoryStream(datos.Length);
        salida.Write(FirmaPng);
        var idat = new MemoryStream();

        int ancho = 0, alto = 0, profundidad = 0, tipoColor = 0, entrelazado = 0;
        var tienePlte = false;
        var fin = false;
        var pos = 8;
        var indice = 0;

        while (pos < datos.Length)
        {
            if (fin)
                return Fallo(Danado); // datos añadidos después de IEND
            if (datos.Length - pos < 12)
                return Fallo(Danado);

            var longitud = BinaryPrimitives.ReadUInt32BigEndian(datos.AsSpan(pos, 4));
            if (longitud > int.MaxValue || longitud > (uint)(datos.Length - pos - 12))
                return Fallo(Danado);

            var largo = (int)longitud;
            var tipoBytes = datos.AsSpan(pos + 4, 4);
            foreach (var b in tipoBytes)
            {
                if (!char.IsAsciiLetter((char)b))
                    return Fallo(Danado);
            }

            var tipo = System.Text.Encoding.ASCII.GetString(tipoBytes);
            var cuerpo = datos.AsSpan(pos + 8, largo);
            var crc = BinaryPrimitives.ReadUInt32BigEndian(datos.AsSpan(pos + 8 + largo, 4));
            if (Crc32.Calcular(datos.AsSpan(pos + 4, 4 + largo)) != crc)
                return Fallo(Danado);

            if (indice == 0 && tipo != "IHDR")
                return Fallo(Danado);

            var copiar = false;
            switch (tipo)
            {
                case "IHDR":
                    if (indice != 0 || largo != 13)
                        return Fallo(Danado);
                    ancho = (int)Math.Min(BinaryPrimitives.ReadUInt32BigEndian(cuerpo[..4]), int.MaxValue);
                    alto = (int)Math.Min(BinaryPrimitives.ReadUInt32BigEndian(cuerpo.Slice(4, 4)), int.MaxValue);
                    profundidad = cuerpo[8];
                    tipoColor = cuerpo[9];
                    entrelazado = cuerpo[12];
                    if (ancho <= 0 || alto <= 0 || cuerpo[10] != 0 || cuerpo[11] != 0 || entrelazado > 1 ||
                        !ProfundidadPngValida(tipoColor, profundidad))
                        return Fallo(Danado);
                    if (ancho > AlmacenImagenesVehiculos.DimensionMaxima || alto > AlmacenImagenesVehiculos.DimensionMaxima)
                        return new Resultado("PNG", ancho, alto, null, null); // el almacén informa el límite
                    copiar = true;
                    break;
                case "PLTE":
                    if (largo == 0 || largo % 3 != 0 || largo > 768 || idat.Length > 0)
                        return Fallo(Danado);
                    tienePlte = true;
                    copiar = true;
                    break;
                case "IDAT":
                    idat.Write(cuerpo);
                    copiar = true;
                    break;
                case "IEND":
                    if (largo != 0)
                        return Fallo(Danado);
                    fin = true;
                    copiar = true;
                    break;
                default:
                    // Chunk crítico desconocido (primera letra mayúscula): no se puede interpretar con seguridad.
                    if (char.IsAsciiLetterUpper(tipo[0]))
                        return Fallo(Danado);
                    copiar = AuxiliaresPngPermitidos.Contains(tipo);
                    break;
            }

            if (copiar)
                salida.Write(datos.AsSpan(pos, 12 + largo));

            pos += 12 + largo;
            indice++;
        }

        if (!fin || idat.Length == 0 || (tipoColor == 3 && !tienePlte))
            return Fallo(Danado);

        if (!FlujoIdatValido(idat.ToArray(), ancho, alto, profundidad, tipoColor, entrelazado == 1))
            return Fallo(Danado);

        return new Resultado("PNG", ancho, alto, salida.ToArray(), null);
    }

    private static bool ProfundidadPngValida(int tipoColor, int profundidad) => tipoColor switch
    {
        0 => profundidad is 1 or 2 or 4 or 8 or 16,
        3 => profundidad is 1 or 2 or 4 or 8,
        2 or 4 or 6 => profundidad is 8 or 16,
        _ => false
    };

    /// <summary>
    /// Descomprime IDAT y verifica que contiene exactamente una fila filtrada (filtro 0–4) por
    /// cada línea de la imagen (o de cada pasada Adam7). Se detiene en cuanto el flujo supera el
    /// tamaño esperado, por lo que un archivo pequeño no puede expandirse sin límite.
    /// </summary>
    internal static bool FlujoIdatValido(byte[] comprimido, int ancho, int alto, int profundidad, int tipoColor, bool entrelazado)
    {
        var canales = tipoColor switch { 0 => 1, 2 => 3, 3 => 1, 4 => 2, 6 => 4, _ => 0 };
        var bitsPorPixel = canales * profundidad;

        var filas = new List<(long Bytes, long Cantidad)>();
        if (!entrelazado)
        {
            filas.Add((BytesPorFila(ancho, bitsPorPixel), alto));
        }
        else
        {
            // Pasadas Adam7: (inicio x, inicio y, paso x, paso y).
            int[,] pasadas = { { 0, 0, 8, 8 }, { 4, 0, 8, 8 }, { 0, 4, 4, 8 }, { 2, 0, 4, 4 }, { 0, 2, 2, 4 }, { 1, 0, 2, 2 }, { 0, 1, 1, 2 } };
            for (var p = 0; p < 7; p++)
            {
                long anchoPasada = (ancho - pasadas[p, 0] + pasadas[p, 2] - 1) / pasadas[p, 2];
                long altoPasada = (alto - pasadas[p, 1] + pasadas[p, 3] - 1) / pasadas[p, 3];
                if (anchoPasada > 0 && altoPasada > 0)
                    filas.Add((BytesPorFila(anchoPasada, bitsPorPixel), altoPasada));
            }
        }

        long esperado = filas.Sum(f => (1 + f.Bytes) * f.Cantidad);

        try
        {
            using var zlib = new ZLibStream(new MemoryStream(comprimido), CompressionMode.Decompress);
            var buffer = new byte[64 * 1024];
            long total = 0;
            var grupo = 0;
            long filaEnGrupo = 0;
            long posEnFila = 0;
            int leidos;
            while ((leidos = zlib.Read(buffer, 0, buffer.Length)) > 0)
            {
                for (var i = 0; i < leidos; i++)
                {
                    if (total + i >= esperado)
                        return false; // más datos de los que admiten las dimensiones declaradas
                    if (posEnFila == 0 && buffer[i] > 4)
                        return false; // tipo de filtro inválido
                    if (++posEnFila == 1 + filas[grupo].Bytes)
                    {
                        posEnFila = 0;
                        if (++filaEnGrupo == filas[grupo].Cantidad)
                        {
                            filaEnGrupo = 0;
                            grupo++;
                        }
                    }
                }

                total += leidos;
            }

            return total == esperado;
        }
        catch (InvalidDataException)
        {
            return false;
        }
    }

    private static long BytesPorFila(long ancho, int bitsPorPixel) => (ancho * bitsPorPixel + 7) / 8;

    #endregion

    #region JPEG

    private static Resultado Jpeg(byte[] datos)
    {
        var salida = new MemoryStream(datos.Length);
        salida.Write([0xFF, 0xD8]);

        int ancho = 0, alto = 0;
        var tieneSof = false;
        var tieneDqt = false;
        var escaneos = 0;
        var pos = 2;

        while (true)
        {
            // Busca el siguiente marcador (se admiten bytes de relleno 0xFF).
            if (pos >= datos.Length || datos[pos] != 0xFF)
                return Fallo(Danado);
            while (pos < datos.Length && datos[pos] == 0xFF)
                pos++;
            if (pos >= datos.Length)
                return Fallo(Danado);

            var marcador = datos[pos++];
            if (marcador == 0xD9)
            {
                if (escaneos == 0)
                    return Fallo(Danado);
                salida.Write([0xFF, 0xD9]);
                break; // los bytes posteriores a EOI (datos añadidos) se descartan
            }

            if (marcador is 0x00 or 0x01 or 0xD8 or (>= 0xD0 and <= 0xD7))
                return Fallo(Danado);

            if (datos.Length - pos < 2)
                return Fallo(Danado);
            var longitud = BinaryPrimitives.ReadUInt16BigEndian(datos.AsSpan(pos, 2));
            if (longitud < 2 || longitud > datos.Length - pos)
                return Fallo(Danado);
            var segmento = datos.AsSpan(pos - 2, longitud + 2); // incluye FF + marcador
            var cuerpo = datos.AsSpan(pos + 2, longitud - 2);
            pos += longitud;

            var esSof = marcador is >= 0xC0 and <= 0xCF and not 0xC4 and not 0xC8 and not 0xCC;
            if (esSof)
            {
                if (tieneSof || cuerpo.Length < 6)
                    return Fallo(Danado);
                alto = BinaryPrimitives.ReadUInt16BigEndian(cuerpo.Slice(1, 2));
                ancho = BinaryPrimitives.ReadUInt16BigEndian(cuerpo.Slice(3, 2));
                int componentes = cuerpo[5];
                if (alto == 0 || ancho == 0 || componentes is not (1 or 3 or 4) || cuerpo.Length != 6 + 3 * componentes)
                    return Fallo(Danado);
                tieneSof = true;
                Escribir(salida, segmento);
                if (ancho > AlmacenImagenesVehiculos.DimensionMaxima || alto > AlmacenImagenesVehiculos.DimensionMaxima)
                    return new Resultado("JPEG", ancho, alto, null, null);
                continue;
            }

            switch (marcador)
            {
                case 0xDB: // DQT
                    tieneDqt = true;
                    Escribir(salida, segmento);
                    break;
                case 0xC4 or 0xCC or 0xDD: // DHT, DAC, DRI
                    Escribir(salida, segmento);
                    break;
                case 0xE0 or 0xEE: // APP0 (JFIF) y APP14 (Adobe: transformación de color)
                    Escribir(salida, segmento);
                    break;
                case (>= 0xE1 and <= 0xEF) or 0xFE: // APP1–APP15 (EXIF/GPS, XMP, ICC, IPTC…) y comentarios
                    break;
                case 0xDA: // SOS: le siguen datos de entropía hasta el próximo marcador
                    if (!tieneSof || !tieneDqt)
                        return Fallo(Danado);
                    Escribir(salida, segmento);
                    var inicio = pos;
                    pos = FinDatosEntropia(datos, pos);
                    if (pos < 0 || pos == inicio)
                        return Fallo(Danado);
                    salida.Write(datos.AsSpan(inicio, pos - inicio));
                    escaneos++;
                    break;
                default:
                    return Fallo(Danado);
            }
        }

        if (!tieneSof)
            return Fallo(Danado);

        return new Resultado("JPEG", ancho, alto, salida.ToArray(), null);
    }

    /// <summary>Posición del siguiente marcador real tras los datos de entropía (FF00 y RSTn son datos).</summary>
    private static int FinDatosEntropia(byte[] datos, int pos)
    {
        for (var i = pos; i < datos.Length - 1; i++)
        {
            if (datos[i] != 0xFF)
                continue;
            var siguiente = datos[i + 1];
            if (siguiente == 0x00 || siguiente is >= 0xD0 and <= 0xD7 || siguiente == 0xFF)
                continue;
            return i;
        }

        return -1; // sin EOI: archivo truncado
    }

    private static void Escribir(MemoryStream salida, ReadOnlySpan<byte> segmento) => salida.Write(segmento);

    #endregion

    #region WebP

    private static Resultado Webp(byte[] datos)
    {
        var tamanoRiff = BinaryPrimitives.ReadUInt32LittleEndian(datos.AsSpan(4, 4));
        if (tamanoRiff < 4 || (long)tamanoRiff + 8 != datos.Length)
            return Fallo(Danado);

        var chunks = new List<(string Tipo, int Inicio, int Largo)>();
        var pos = 12;
        while (pos < datos.Length)
        {
            if (datos.Length - pos < 8)
                return Fallo(Danado);
            var tipo = System.Text.Encoding.ASCII.GetString(datos, pos, 4);
            var largo = BinaryPrimitives.ReadUInt32LittleEndian(datos.AsSpan(pos + 4, 4));
            var relleno = largo % 2;
            if (largo > (uint)(datos.Length - pos - 8) || largo + relleno > (uint)(datos.Length - pos - 8))
                return Fallo(Danado);
            chunks.Add((tipo, pos, (int)largo));
            pos += 8 + (int)largo + (int)relleno;
        }

        if (chunks.Count == 0)
            return Fallo(Danado);

        var primero = chunks[0];
        if (primero.Tipo is "VP8 " or "VP8L")
        {
            if (chunks.Count != 1)
                return Fallo(Danado);
            var (ok, ancho, alto) = CabeceraWebp(primero.Tipo, datos.AsSpan(primero.Inicio + 8, primero.Largo));
            return ok ? new Resultado("WEBP", ancho, alto, datos.ToArray(), null) : Fallo(Danado);
        }

        if (primero.Tipo != "VP8X" || primero.Largo != 10)
            return Fallo(Danado);

        var vp8x = datos.AsSpan(primero.Inicio + 8, 10);
        var banderas = vp8x[0];
        if ((banderas & 0x02) != 0)
            return Fallo("Las imágenes animadas no están permitidas.");
        var anchoLienzo = 1 + (vp8x[4] | (vp8x[5] << 8) | (vp8x[6] << 16));
        var altoLienzo = 1 + (vp8x[7] | (vp8x[8] << 8) | (vp8x[9] << 16));
        if (anchoLienzo > AlmacenImagenesVehiculos.DimensionMaxima || altoLienzo > AlmacenImagenesVehiculos.DimensionMaxima)
            return new Resultado("WEBP", anchoLienzo, altoLienzo, null, null);

        var conservados = new List<(string Tipo, int Inicio, int Largo)>();
        var imagenes = 0;
        foreach (var chunk in chunks.Skip(1))
        {
            switch (chunk.Tipo)
            {
                case "VP8 " or "VP8L":
                    var (ok, ancho, alto) = CabeceraWebp(chunk.Tipo, datos.AsSpan(chunk.Inicio + 8, chunk.Largo));
                    if (!ok || ancho != anchoLienzo || alto != altoLienzo)
                        return Fallo(Danado);
                    imagenes++;
                    conservados.Add(chunk);
                    break;
                case "ALPH":
                    conservados.Add(chunk);
                    break;
                case "ANIM" or "ANMF":
                    return Fallo("Las imágenes animadas no están permitidas.");
                default:
                    break; // ICCP, EXIF, XMP y chunks desconocidos se eliminan
            }
        }

        if (imagenes != 1)
            return Fallo(Danado);

        var salida = new MemoryStream(datos.Length);
        salida.Write("RIFF"u8);
        salida.Write(new byte[4]); // tamaño, se completa al final
        salida.Write("WEBP"u8);
        salida.Write(datos.AsSpan(primero.Inicio, 8));
        // Sin ICC (0x20), EXIF (0x08) ni XMP (0x04); se conserva la bandera de transparencia (0x10).
        salida.WriteByte((byte)(banderas & 0x10));
        salida.Write(vp8x[1..]);
        foreach (var chunk in conservados)
        {
            salida.Write(datos.AsSpan(chunk.Inicio, 8 + chunk.Largo + chunk.Largo % 2));
        }

        var resultado = salida.ToArray();
        BinaryPrimitives.WriteUInt32LittleEndian(resultado.AsSpan(4, 4), (uint)(resultado.Length - 8));
        return new Resultado("WEBP", anchoLienzo, altoLienzo, resultado, null);
    }

    private static (bool Ok, int Ancho, int Alto) CabeceraWebp(string tipo, ReadOnlySpan<byte> cuerpo)
    {
        if (tipo == "VP8 ")
        {
            // Etiqueta de cuadro (3 bytes, cuadro clave), código de inicio 9D 01 2A y dimensiones de 14 bits.
            if (cuerpo.Length < 10 || (cuerpo[0] & 0x01) != 0 || cuerpo[3] != 0x9D || cuerpo[4] != 0x01 || cuerpo[5] != 0x2A)
                return (false, 0, 0);
            var ancho = BinaryPrimitives.ReadUInt16LittleEndian(cuerpo.Slice(6, 2)) & 0x3FFF;
            var alto = BinaryPrimitives.ReadUInt16LittleEndian(cuerpo.Slice(8, 2)) & 0x3FFF;
            return (ancho > 0 && alto > 0, ancho, alto);
        }

        // VP8L: firma 0x2F, ancho-1 y alto-1 en 14 bits cada uno y versión 0.
        if (cuerpo.Length < 5 || cuerpo[0] != 0x2F)
            return (false, 0, 0);
        var bits = BinaryPrimitives.ReadUInt32LittleEndian(cuerpo.Slice(1, 4));
        var w = (int)(bits & 0x3FFF) + 1;
        var h = (int)((bits >> 14) & 0x3FFF) + 1;
        return ((bits >> 29) == 0, w, h);
    }

    #endregion
}

/// <summary>CRC-32 (ISO-HDLC, el usado por PNG y zlib).</summary>
internal static class Crc32
{
    private static readonly uint[] Tabla = CrearTabla();

    private static uint[] CrearTabla()
    {
        var tabla = new uint[256];
        for (uint n = 0; n < 256; n++)
        {
            var c = n;
            for (var k = 0; k < 8; k++)
                c = (c & 1) != 0 ? 0xEDB88320u ^ (c >> 1) : c >> 1;
            tabla[n] = c;
        }

        return tabla;
    }

    public static uint Calcular(ReadOnlySpan<byte> datos)
    {
        var c = 0xFFFFFFFFu;
        foreach (var b in datos)
            c = Tabla[(c ^ b) & 0xFF] ^ (c >> 8);
        return c ^ 0xFFFFFFFFu;
    }
}
