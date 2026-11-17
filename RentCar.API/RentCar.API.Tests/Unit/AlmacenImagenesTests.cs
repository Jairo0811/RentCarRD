using System.Text;
using Microsoft.AspNetCore.Http;
using RentCar.API.Infrastructure;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Metadata.Profiles.Exif;
using SixLabors.ImageSharp.PixelFormats;

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

    internal static byte[] Png(int ancho, int alto, bool conExif = false)
    {
        using var imagen = new Image<Rgba32>(ancho, alto, new Rgba32(30, 80, 160));
        if (conExif)
        {
            imagen.Metadata.ExifProfile = new ExifProfile();
            imagen.Metadata.ExifProfile.SetValue(ExifTag.Artist, "Ubicacion privada");
        }

        using var memoria = new MemoryStream();
        imagen.SaveAsPng(memoria);
        return memoria.ToArray();
    }

    internal static byte[] Jpeg(int ancho, int alto, bool conExif)
    {
        using var imagen = new Image<Rgba32>(ancho, alto, new Rgba32(200, 20, 20));
        if (conExif)
        {
            imagen.Metadata.ExifProfile = new ExifProfile();
            imagen.Metadata.ExifProfile.SetValue(ExifTag.Artist, "Ubicacion privada");
        }

        using var memoria = new MemoryStream();
        imagen.SaveAsJpeg(memoria);
        return memoria.ToArray();
    }

    internal static IFormFile Archivo(byte[] contenido, string nombre) =>
        new FormFile(new MemoryStream(contenido), 0, contenido.Length, "imagen", nombre);

    [Fact]
    public async Task Acepta_imagen_valida_y_genera_nombre_del_servidor()
    {
        var resultado = await _almacen.GuardarAsync(Archivo(Png(200, 120), "../../etc/passwd.png"), CancellationToken.None);

        Assert.True(resultado.Exito, resultado.Error);
        Assert.Matches("^[0-9a-f]{32}\\.png$", resultado.NombreArchivo);
        Assert.True(File.Exists(Path.Combine(_almacen.Carpeta, resultado.NombreArchivo!)));
        Assert.Empty(Directory.GetFiles(_almacen.Carpeta, "*.tmp"));
    }

    [Fact]
    public async Task Elimina_metadatos_exif_al_recodificar()
    {
        var resultado = await _almacen.GuardarAsync(Archivo(Jpeg(300, 200, conExif: true), "foto.jpg"), CancellationToken.None);

        Assert.True(resultado.Exito, resultado.Error);
        using var guardada = await Image.LoadAsync(Path.Combine(_almacen.Carpeta, resultado.NombreArchivo!));
        Assert.Null(guardada.Metadata.ExifProfile);
    }

    [Fact]
    public async Task Rechaza_extension_falsa()
    {
        var resultado = await _almacen.GuardarAsync(Archivo(Png(100, 100), "foto.jpg"), CancellationToken.None);
        Assert.False(resultado.Exito);
    }

    [Fact]
    public async Task Rechaza_texto_con_extension_de_imagen()
    {
        var resultado = await _almacen.GuardarAsync(
            Archivo(Encoding.UTF8.GetBytes("<script>alert(1)</script> no soy una imagen"), "x.png"), CancellationToken.None);
        Assert.False(resultado.Exito);
    }

    [Fact]
    public async Task Rechaza_archivo_malformado_con_firma_valida()
    {
        var png = Png(100, 100);
        var truncado = png.Take(40).Concat(new byte[200]).ToArray();

        var resultado = await _almacen.GuardarAsync(Archivo(truncado, "roto.png"), CancellationToken.None);

        Assert.False(resultado.Exito);
        Assert.Empty(Directory.Exists(_almacen.Carpeta) ? Directory.GetFiles(_almacen.Carpeta) : Array.Empty<string>());
    }

    [Fact]
    public async Task Rechaza_dimensiones_abusivas()
    {
        var resultado = await _almacen.GuardarAsync(
            Archivo(Png(AlmacenImagenesVehiculos.DimensionMaxima + 1, 40), "ancha.png"), CancellationToken.None);
        Assert.False(resultado.Exito);
        Assert.Contains("dimensiones", resultado.Error);
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
