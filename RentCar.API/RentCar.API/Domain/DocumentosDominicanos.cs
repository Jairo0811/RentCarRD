namespace RentCar.API.Domain;

/// <summary>
/// Validación local de documentos dominicanos. Antes estaba duplicada en
/// ClientesController, EmpleadosController y Helpers/ValidacionesHelper.
/// </summary>
public static class DocumentosDominicanos
{
    public static string SoloDigitos(string? valor) =>
        string.IsNullOrWhiteSpace(valor) ? string.Empty : new string(valor.Where(char.IsAsciiDigit).ToArray());

    /// <summary>Cédula de 11 dígitos con dígito verificador (Luhn / módulo 10).</summary>
    public static bool CedulaValida(string? cedula)
    {
        var digitos = SoloDigitos(cedula);
        if (digitos.Length != 11 || digitos.All(c => c == digitos[0]))
        {
            return false;
        }

        int[] pesos = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
        var suma = 0;
        for (var i = 0; i < 10; i++)
        {
            var valor = (digitos[i] - '0') * pesos[i];
            suma += valor >= 10 ? (valor / 10) + (valor % 10) : valor;
        }

        var verificador = (10 - (suma % 10)) % 10;
        return verificador == digitos[10] - '0';
    }

    /// <summary>RNC de 9 dígitos con dígito verificador (módulo 11 de la DGII).</summary>
    public static bool RncValido(string? rnc)
    {
        var digitos = SoloDigitos(rnc);
        if (digitos.Length != 9 || digitos.All(c => c == digitos[0]))
        {
            return false;
        }

        int[] pesos = [7, 9, 8, 6, 5, 4, 3, 2];
        var suma = 0;
        for (var i = 0; i < 8; i++)
        {
            suma += (digitos[i] - '0') * pesos[i];
        }

        var resto = suma % 11;
        var verificador = resto switch
        {
            0 => 2,
            1 => 1,
            _ => 11 - resto
        };

        return verificador == digitos[8] - '0';
    }

    public static string FormatearCedula(string? cedula)
    {
        var d = SoloDigitos(cedula);
        return d.Length == 11 ? $"{d[..3]}-{d.Substring(3, 7)}-{d[10]}" : d;
    }

    public static string FormatearRnc(string? rnc)
    {
        var d = SoloDigitos(rnc);
        return d.Length == 9 ? $"{d[..3]}-{d.Substring(3, 5)}-{d[8]}" : d;
    }
}
