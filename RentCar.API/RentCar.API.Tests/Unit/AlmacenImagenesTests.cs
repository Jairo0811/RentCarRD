using System.Buffers.Binary;
using System.Text;
using Microsoft.AspNetCore.Http;
using RentCar.API.Infrastructure;

namespace RentCar.API.Tests.Unit;

public sealed class AlmacenImagenesTests : IDisposable
{
    private readonly string _raiz = Path.Combine(Path.GetTempPath(), "rentcarrd-img-" + Guid.NewGuid().ToString("N"));
    private readonly AlmacenImagenesVehiculos _almacen;

    public AlmacenImagenesTests()
    {
        Directory.CreateDirectory(_raiz);
        _almacen = new AlmacenImagenesVehiculos(new RentCar.API.Tests.Integration.EntornoWebPrueba(_raiz));
    }

    public void Dispose()
    {
        if (Directory.Exists(_raiz))
        {
            Directory.Delete(_raiz, recursive: true);
        }
    }

    /// <summary>Compatibilidad con las pruebas de integración.</summary>
    internal static byte[] Png(int ancho, int alto) => ImagenesDePrueba.Png(ancho, alto);

    internal static IFormFile Archivo(byte[] contenido, string nombre) =>
        new FormFile(new MemoryStream(contenido), 0, contenido.Length, "imagen", nombre);

    private async Task<byte[]> GuardarYLeer(byte[] contenido, string nombre)
    {
        var resultado = await _almacen.GuardarAsync(Archivo(contenido, nombre), CancellationToken.None);
        Assert.True(resultado.Exito, resultado.Error);
        return await File.ReadAllBytesAsync(Path.Combine(_almacen.Carpeta, resultado.NombreArchivo!));
    }

    private string[] ArchivosGuardados() =>
        Directory.Exists(_almacen.Carpeta) ? Directory.GetFiles(_almacen.Carpeta) : [];

    [Fact]
    public async Task Acepta_imagen_valida_y_genera_nombre_del_servidor()
    {
        var resultado = await _almacen.GuardarAsync(Archivo(ImagenesDePrueba.Png(200, 120), "../../etc/passwd.png"), CancellationToken.None);

        Assert.True(resultado.Exito, resultado.Error);
        Assert.Matches("^[0-9a-f]{32}\\.png$", resultado.NombreArchivo);
        Assert.True(File.Exists(Path.Combine(_almacen.Carpeta, resultado.NombreArchivo!)));
        Assert.Empty(Directory.GetFiles(_almacen.Carpeta, "*.tmp"));
    }

    [Theory]
    [InlineData("JpegConExif", "foto.jpg")]
    [InlineData("JpegProgresivo", "foto.jpeg")]
    [InlineData("WebpConPerdida", "foto.webp")]
    [InlineData("WebpSinPerdida", "foto.webp")]
    [InlineData("WebpConExif", "foto.webp")]
    public async Task Acepta_jpeg_y_webp_reales(string fixture, string nombre)
    {
        var bytes = (byte[])typeof(ImagenesDePrueba).GetField(fixture)!.GetValue(null)!;
        var analisis = ValidadorImagenes.Analizar(bytes);

        Assert.True(analisis.Exito, analisis.Error);
        Assert.Equal(64, analisis.Ancho);
        Assert.Equal(48, analisis.Alto);
        await GuardarYLeer(bytes, nombre);
    }

    [Fact]
    public async Task Acepta_png_entrelazado()
    {
        var guardado = await GuardarYLeer(ImagenesDePrueba.Png(77, 45, entrelazado: true), "entrelazado.png");
        Assert.True(ValidadorImagenes.Analizar(guardado).Exito);
    }

    [Fact]
    public async Task Elimina_exif_y_comentarios_de_jpeg()
    {
        Assert.True(ImagenesDePrueba.Contiene(ImagenesDePrueba.JpegConExif, "Ubicacion privada"));
        Assert.True(ImagenesDePrueba.Contiene(ImagenesDePrueba.JpegConExif, "comentario privado"));

        var guardado = await GuardarYLeer(ImagenesDePrueba.JpegConExif, "foto.jpg");

        Assert.False(ImagenesDePrueba.Contiene(guardado, "Ubicacion privada"));
        Assert.False(ImagenesDePrueba.Contiene(guardado, "CamaraPrivada"));
        Assert.False(ImagenesDePrueba.Contiene(guardado, "comentario privado"));
        Assert.False(ImagenesDePrueba.Contiene(guardado, "Exif"));
        // El resultado sigue siendo un JPEG estructuralmente válido y de las mismas dimensiones.
        var analisis = ValidadorImagenes.Analizar(guardado);
        Assert.True(analisis.Exito, analisis.Error);
        Assert.Equal((64, 48), (analisis.Ancho, analisis.Alto));
    }

    [Fact]
    public async Task Elimina_exif_de_webp_y_actualiza_banderas()
    {
        Assert.True(ImagenesDePrueba.Contiene(ImagenesDePrueba.WebpConExif, "Ubicacion privada"));

        var guardado = await GuardarYLeer(ImagenesDePrueba.WebpConExif, "foto.webp");

        Assert.False(ImagenesDePrueba.Contiene(guardado, "Ubicacion privada"));
        Assert.False(ImagenesDePrueba.Contiene(guardado, "EXIF"));
        Assert.Equal(0, guardado[20] & 0x08); // bandera EXIF de VP8X desactivada
        Assert.Equal((uint)(guardado.Length - 8), BinaryPrimitives.ReadUInt32LittleEndian(guardado.AsSpan(4, 4)));
        Assert.True(ValidadorImagenes.Analizar(guardado).Exito);
    }

    [Fact]
    public async Task Elimina_textos_y_exif_de_png()
    {
        var original = ImagenesDePrueba.Png(120, 80, conTexto: true);
        Assert.True(ImagenesDePrueba.Contiene(original, "Ubicacion privada"));

        var guardado = await GuardarYLeer(original, "con-texto.png");

        Assert.False(ImagenesDePrueba.Contiene(guardado, "Ubicacion privada"));
        Assert.False(ImagenesDePrueba.Contiene(guardado, "tEXt"));
        Assert.False(ImagenesDePrueba.Contiene(guardado, "eXIf"));
        Assert.True(ValidadorImagenes.Analizar(guardado).Exito);
    }

    [Fact]
    public async Task Rechaza_webp_animado()
    {
        var resultado = await _almacen.GuardarAsync(Archivo(ImagenesDePrueba.WebpAnimado, "anim.webp"), CancellationToken.None);
        Assert.False(resultado.Exito);
        Assert.Contains("animadas", resultado.Error);
    }

    [Fact]
    public async Task Rechaza_extension_falsa()
    {
        var resultado = await _almacen.GuardarAsync(Archivo(ImagenesDePrueba.Png(100, 100), "foto.jpg"), CancellationToken.None);
        Assert.False(resultado.Exito);
        Assert.Empty(ArchivosGuardados());
    }

    [Fact]
    public async Task Rechaza_texto_con_extension_de_imagen()
    {
        var resultado = await _almacen.GuardarAsync(
            Archivo(Encoding.UTF8.GetBytes("<script>alert(1)</script> no soy una imagen"), "x.png"), CancellationToken.None);
        Assert.False(resultado.Exito);
    }

    [Fact]
    public async Task Rechaza_png_malformado_con_firma_valida()
    {
        var png = ImagenesDePrueba.Png(100, 100);
        var truncado = png.Take(40).Concat(new byte[200]).ToArray();

        var resultado = await _almacen.GuardarAsync(Archivo(truncado, "roto.png"), CancellationToken.None);

        Assert.False(resultado.Exito);
        Assert.Empty(ArchivosGuardados());
    }

    [Fact]
    public void Rechaza_png_con_crc_alterado_o_datos_tras_iend()
    {
        var png = ImagenesDePrueba.Png(64, 64);
        var crcAlterado = (byte[])png.Clone();
        crcAlterado[29] ^= 0xFF; // primer byte del CRC de IHDR
        Assert.False(ValidadorImagenes.Analizar(crcAlterado).Exito);

        var conCola = png.Concat(Encoding.ASCII.GetBytes("<?php echo 1; ?>")).ToArray();
        Assert.False(ValidadorImagenes.Analizar(conCola).Exito);
    }

    [Fact]
    public void Rechaza_png_cuyo_flujo_no_coincide_con_las_dimensiones()
    {
        // IHDR declara 64×64 pero IDAT contiene los datos de una imagen de 64×10.
        var correcto = ImagenesDePrueba.Png(64, 10);
        var alterado = (byte[])correcto.Clone();
        BinaryPrimitives.WriteUInt32BigEndian(alterado.AsSpan(20, 4), 64);
        var ihdr = alterado.AsSpan(12, 17).ToArray();
        BinaryPrimitives.WriteUInt32BigEndian(alterado.AsSpan(29, 4), Crc32.Calcular(ihdr));

        Assert.False(ValidadorImagenes.Analizar(alterado).Exito);
    }

    [Fact]
    public void Rechaza_jpeg_truncado()
    {
        var jpeg = ImagenesDePrueba.JpegConExif;
        Assert.False(ValidadorImagenes.Analizar(jpeg.Take(jpeg.Length / 2).ToArray()).Exito);
    }

    [Fact]
    public void Descarta_datos_anadidos_despues_del_fin_de_un_jpeg()
    {
        var conCola = ImagenesDePrueba.JpegProgresivo.Concat(Encoding.ASCII.GetBytes("CARGA-OCULTA")).ToArray();
        var analisis = ValidadorImagenes.Analizar(conCola);

        Assert.True(analisis.Exito, analisis.Error);
        Assert.False(ImagenesDePrueba.Contiene(analisis.Contenido!, "CARGA-OCULTA"));
        Assert.Equal(new byte[] { 0xFF, 0xD9 }, analisis.Contenido![^2..]);
    }

    [Fact]
    public void Rechaza_webp_con_tamano_riff_inconsistente()
    {
        var webp = (byte[])ImagenesDePrueba.WebpConPerdida.Clone();
        BinaryPrimitives.WriteUInt32LittleEndian(webp.AsSpan(4, 4), (uint)webp.Length + 100);
        Assert.False(ValidadorImagenes.Analizar(webp).Exito);
    }

    [Fact]
    public async Task Rechaza_dimensiones_abusivas()
    {
        var resultado = await _almacen.GuardarAsync(
            Archivo(ImagenesDePrueba.Png(AlmacenImagenesVehiculos.DimensionMaxima + 1, 40), "ancha.png"), CancellationToken.None);
        Assert.False(resultado.Exito);
        Assert.Contains("dimensiones", resultado.Error);
    }

    [Fact]
    public async Task Rechaza_imagen_demasiado_pequena()
    {
        var resultado = await _almacen.GuardarAsync(Archivo(ImagenesDePrueba.Png(10, 10), "mini.png"), CancellationToken.None);
        Assert.False(resultado.Exito);
        Assert.Contains("pequeña", resultado.Error);
    }

    [Fact]
    public async Task Rechaza_archivo_que_supera_el_limite()
    {
        var grande = new byte[AlmacenImagenesVehiculos.TamanoMaximoBytes + 1];
        var resultado = await _almacen.GuardarAsync(Archivo(grande, "grande.png"), CancellationToken.None);
        Assert.False(resultado.Exito);
        Assert.Contains("5 MB", resultado.Error);
    }

    [Fact]
    public void Eliminar_ignora_rutas_manipuladas()
    {
        var externo = Path.Combine(_raiz, "secreto.txt");
        File.WriteAllText(externo, "no borrar");

        _almacen.Eliminar("/vehiculos/../secreto.txt");
        _almacen.Eliminar("../secreto.txt");
        _almacen.Eliminar(externo);

        Assert.True(File.Exists(externo));
    }
}
