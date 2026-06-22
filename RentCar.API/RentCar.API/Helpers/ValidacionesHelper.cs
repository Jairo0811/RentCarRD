using System;
using System.Linq;

namespace RentCar.API.Helpers
{
    public static class ValidacionesHelper
    {
        /// <summary>
        /// Valida la integridad de una cédula dominicana usando el algoritmo de Luhn/Mod 10.
        /// </summary>
        public static bool validaCedula(string pCedula)
        {
            if (string.IsNullOrEmpty(pCedula)) return false;

            string vcCedula = pCedula.Replace("-", "");
            if (vcCedula.Length != 11) return false;

            int vnTotal = 0;
            int[] digitoMult = new int[11] { 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1 };

            for (int vDig = 1; vDig <= 11; vDig++)
            {
                int vCalculo = Int32.Parse(vcCedula.Substring(vDig - 1, 1)) * digitoMult[vDig - 1];
                if (vCalculo < 10)
                    vnTotal += vCalculo;
                else
                    vnTotal += Int32.Parse(vCalculo.ToString().Substring(0, 1)) + Int32.Parse(vCalculo.ToString().Substring(1, 1));
            }
            return (vnTotal % 10 == 0);
        }

        /// <summary>
        /// Valida la integridad de un RNC dominicano usando el algoritmo de cálculo de dígito verificador.
        /// </summary>
        public static bool validarRNC(string rnc)
        {
            if (string.IsNullOrEmpty(rnc) || rnc.Length != 9 || !rnc.All(char.IsDigit))
                return false;

            char[] peso = { '7', '9', '8', '6', '5', '4', '3', '2' };
            int suma = 0;

            for (int i = 0; i < 8; i++)
            {
                suma += (int)(char.GetNumericValue(rnc[i]) * char.GetNumericValue(peso[i]));
            }

            int resto = suma % 11;
            int digito = (resto == 0) ? 2 : (resto == 1) ? 1 : 11 - resto;

            return digito == (int)char.GetNumericValue(rnc[8]);
        }
    }
}