using System.Buffers.Binary;
using System.IO.Compression;
using System.Text;
using RentCar.API.Infrastructure;

namespace RentCar.API.Tests.Unit;

/// <summary>
/// Imágenes de prueba sin dependencias de terceros.
/// - PNG: se construyen en memoria (IHDR, IDAT comprimido con zlib, IEND y CRC reales).
/// - JPEG/WebP: archivos reales de 64×48 px generados con Pillow 12.3 y embebidos en base64
///   (con EXIF "Ubicacion privada", comentario, progresivo, con/sin pérdida y animado).
/// </summary>
public static class ImagenesDePrueba
{
    public static byte[] Png(int ancho, int alto, bool conTexto = false, bool entrelazado = false)
    {
        using var salida = new MemoryStream();
        salida.Write([137, 80, 78, 71, 13, 10, 26, 10]);

        var ihdr = new byte[13];
        BinaryPrimitives.WriteUInt32BigEndian(ihdr.AsSpan(0, 4), (uint)ancho);
        BinaryPrimitives.WriteUInt32BigEndian(ihdr.AsSpan(4, 4), (uint)alto);
        ihdr[8] = 8;  // profundidad
        ihdr[9] = 2;  // RGB
        ihdr[12] = (byte)(entrelazado ? 1 : 0);
        Chunk(salida, "IHDR", ihdr);

        if (conTexto)
        {
            Chunk(salida, "tEXt", Encoding.Latin1.GetBytes("Author\0Ubicacion privada"));
            Chunk(salida, "eXIf", Encoding.Latin1.GetBytes("MM\0*datos-exif-privados"));
        }

        Chunk(salida, "IDAT", Comprimir(DatosCrudos(ancho, alto, entrelazado)));
        Chunk(salida, "IEND", []);
        return salida.ToArray();
    }

    /// <summary>Filas RGB de 8 bits con filtro 0 (o las siete pasadas Adam7 si se entrelaza).</summary>
    private static byte[] DatosCrudos(int ancho, int alto, bool entrelazado)
    {
        var filas = new List<(int Ancho, int Alto)>();
        if (!entrelazado)
        {
            filas.Add((ancho, alto));
        }
        else
        {
            int[,] p = { { 0, 0, 8, 8 }, { 4, 0, 8, 8 }, { 0, 4, 4, 8 }, { 2, 0, 4, 4 }, { 0, 2, 2, 4 }, { 1, 0, 2, 2 }, { 0, 1, 1, 2 } };
            for (var i = 0; i < 7; i++)
            {
                var w = (ancho - p[i, 0] + p[i, 2] - 1) / p[i, 2];
                var h = (alto - p[i, 1] + p[i, 3] - 1) / p[i, 3];
                if (w > 0 && h > 0) filas.Add((w, h));
            }
        }

        using var crudo = new MemoryStream();
        foreach (var (w, h) in filas)
        {
            for (var y = 0; y < h; y++)
            {
                crudo.WriteByte(0);
                for (var x = 0; x < w; x++)
                {
                    crudo.Write([(byte)(x * 7), (byte)(y * 5), 160]);
                }
            }
        }

        return crudo.ToArray();
    }

    public static byte[] Comprimir(byte[] datos)
    {
        using var salida = new MemoryStream();
        using (var zlib = new ZLibStream(salida, CompressionLevel.Optimal, leaveOpen: true))
        {
            zlib.Write(datos);
        }

        return salida.ToArray();
    }

    public static void Chunk(Stream salida, string tipo, byte[] datos)
    {
        var cabecera = new byte[8];
        BinaryPrimitives.WriteUInt32BigEndian(cabecera.AsSpan(0, 4), (uint)datos.Length);
        Encoding.ASCII.GetBytes(tipo, cabecera.AsSpan(4, 4));
        salida.Write(cabecera);
        salida.Write(datos);
        var crc = new byte[4];
        BinaryPrimitives.WriteUInt32BigEndian(crc, Crc32.Calcular(cabecera.AsSpan(4, 4).ToArray().Concat(datos).ToArray()));
        salida.Write(crc);
    }

    /// <summary>Busca una secuencia de bytes (p. ej. un texto de metadatos) dentro de un archivo.</summary>
    public static bool Contiene(byte[] archivo, string texto) =>
        archivo.AsSpan().IndexOf(Encoding.ASCII.GetBytes(texto)) >= 0;

    public static readonly byte[] JpegConExif = Convert.FromBase64String("/9j/4AAQSkZJRgABAQAAAQABAAD/4QBORXhpZgAATU0AKgAAAAgAAgEPAAIAAAAOAAAAJgE7AAIAAAASAAAANAAAAABDYW1hcmFQcml2YWRhAFViaWNhY2lvbiBwcml2YWRhAP/+ABRjb21lbnRhcmlvIHByaXZhZG//2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAwAEADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDzH/Uf9cf/AED/AOt/L6dJqKi/1P8A1y/9B/8Arfy+nTwf4nr+f/B/P13/AGBL2P8Ah/L/AIH5em0tFFFZm4UUUUAL1+tJRTvv/wC9/Oq+L1JS5fQbRRRUlEf+q/65/wDoP/1v5fykopg+T/c/l/8AWq/j9fz/AOD+frvil7L/AA/l/wAD8vTZ9FFFQbBRRRQAUUUUAFFFFACD5fp/Klooq/j9fz/4P5+u+duT0/L/AIH5emxRRRUGh//Z");

    public static readonly byte[] JpegProgresivo = Convert.FromBase64String("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wgARCAAwAEADASIAAhEBAxEB/8QAFwABAQEBAAAAAAAAAAAAAAAAAAIBBv/EABgBAAMBAQAAAAAAAAAAAAAAAAABAgQG/9oADAMBAAIQAxAAAAHmLRg7CxNgA1rAnNJcUFYAAAGaOQVf/8QAFhABAQEAAAAAAAAAAAAAAAAAMTBA/9oACAEBAAEFAiJE3f/EABgRAAMBAQAAAAAAAAAAAAAAABAxMnEg/9oACAEDAQE/AYwoTnKH/8QAFxEBAQEBAAAAAAAAAAAAAAAAEDEgMv/aAAgBAgEBPwHppc0//8QAFhABAQEAAAAAAAAAAAAAAAAAYTBA/9oACAEBAAY/AiJE3f/EABoQAAEFAQAAAAAAAAAAAAAAADAQMVFx8CD/2gAIAQEAAT8h3AdR09riAtQWJ//aAAwDAQACAAMAAAAQEBBhBHBBBBjB/8QAHhEAAQMEAwAAAAAAAAAAAAAAATFxsRCB4fAAESD/2gAIAQMBAT8QA0TEMlALKAbJiGTx1bGIZOf/xAAbEQABBQEBAAAAAAAAAAAAAACxEDFxoeEAIP/aAAgBAgEBPxCx0y6WS50y/i50y/f/xAAfEAABAwQDAQAAAAAAAAAAAADwMDGxARAgcUFRkeH/2gAIAQEAAT8QItGmxfdxDRpsS7uQaIQofHxGniFP/9k=");

    public static readonly byte[] WebpConPerdida = Convert.FromBase64String("UklGRtIAAABXRUJQVlA4IMYAAAAQBwCdASpAADAAPm0yk0ekIqGhKBqpyIANiU2Pk+gzDIAR/QjajXb/x/1X/6f+ngf3D2AOgAAaZ9cczDs7poxEkAD+8QvijKx83hNay4nfPSXE756S4bmEXTuA2Xvb1s32yQr/rmJmxsqgv/7Bx/9g4/GjZsbKnOFvkYU5FGM++VgXRsC6NgaAdkZfjk/fLoSQo4hdd7s/Ke/iItJk8jsnkdk8jsnkxUgs1FQ5P1+XFjY0E4QAAACNdczigP2wbR+6jkxdAAA=");

    public static readonly byte[] WebpSinPerdida = Convert.FromBase64String("UklGRtYAAABXRUJQVlA4TMoAAAAvP8ALAAqEbCRJ4iHqL7nJDcLDDQCAYBPbtm1btW3btm3btm3tPesUWv0nkLT5DbAcAN+/61u8Q4Cfs3KHgD1n/Q6BfM7WHQLznN07BP45B3cI0nOO7xDU55zdIRjPubxDsJ9zc4fgPef+DiF8ztMdQvKc1zuE/DkfdwjVc77vENrn/N0hDH9+5j22Pc49nj3+PcF7wvZE7onZE78naU/qnow92Xvy9hTuKdlTvqdqT+2ehj3Ne9r2dO7p2dO/Z2jP6J6JPdN75s59");

    public static readonly byte[] WebpConExif = Convert.FromBase64String("UklGRjIBAABXRUJQVlA4WAoAAAAIAAAAPwAALwAAVlA4IMYAAAAQBwCdASpAADAAPm0yk0ekIqGhKBqpyIANiU2Pk+gzDIAR/QjajXb/x/1X/6f+ngf3D2AOgAAaZ9cczDs7poxEkAD+8QvijKx83hNay4nfPSXE756S4bmEXTuA2Xvb1s32yQr/rmJmxsqgv/7Bx/9g4/GjZsbKnOFvkYU5FGM++VgXRsC6NgaAdkZfjk/fLoSQo4hdd7s/Ke/iItJk8jsnkdk8jsnkxUgs1FQ5P1+XFjY0E4QAAACNdczigP2wbR+6jkxdAABFWElGRgAAAE1NACoAAAAIAAIBDwACAAAADgAAACYBOwACAAAAEgAAADQAAAAAQ2FtYXJhUHJpdmFkYQBVYmljYWNpb24gcHJpdmFkYQA=");

    public static readonly byte[] WebpAnimado = Convert.FromBase64String("UklGRjQCAABXRUJQVlA4WAoAAAACAAAAPwAALwAAQU5JTQYAAAAAAAAAAABBTk1G6gAAAAAAAAAAAD8AAC8AAGQAAAJWUDgg0gAAALAGAJ0BKkAAMAA+bTCSRyQioaEoC4iADYlNj5PoM5yAED7w8B/8P9V/+n/p4H9o9gDoABwSKCMYYZE65ENgAP7w+5JOqUzeIqwLifDIJcT4ZBLhv6o76vr8/rb9o1Tkbg/1zEzY2VQX//Wh//7aH+/H5sbKoL/seqQlAljEf8IYDfx2O6aUnx3pCzpzGXBnUCFkDGMCfXw99XC3F7+iEXQOvPWAwjphJwabbUhnL+6CeoK4H8x/A/902LDyCdmGaMpOJTGq5Ykajqg7UF+RwgAAAEFOTUYWAQAAAAAAAAAAPwAALwAAZAAAAFZQOCD+AAAAtAkAnQEqQAAwAD5tKJJFgtWZ2wAA2JTXKf/b633X/4gF6b/zvL/+YANsC/gNkAozuB1B6O9gH4AVf/j/oAD//6eB/AP2S7P/0AP4ABaYh9Y56HNoKUAA/tx7mWRj+jjCOOXSS7HLpJTkHghH/NsDltqg/t6O0XP+tAUM7FPEfvz95rUl2Z25cftpIh/P3mlf1in9FdWgyHGLPmtewPyrdV+yc3Ph4K/CLL7EuVd5awnSNf7RYX4A1yTbNC/Spr3uQQ5ImypNlKGndpf8KSxMnKht0kV+RdVVnie7a/pJ1BbZ/RXVoMhxiz5rYz/W1z8oH7hf7L/AJRuTlQMAAAA=");

}
