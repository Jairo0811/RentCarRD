using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RentCar.API.Models;

#nullable disable

namespace RentCar.API.Migrations;

[DbContext(typeof(RentCarDbContext))]
[Migration("20260820120000_SecurityHardening")]
public sealed class SecurityHardening : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            IF COL_LENGTH('Clientes', 'NoTarjetaCR') IS NOT NULL
                ALTER TABLE Clientes DROP COLUMN NoTarjetaCR;
            IF COL_LENGTH('Clientes', 'NombreTitularTarjeta') IS NOT NULL
                ALTER TABLE Clientes DROP COLUMN NombreTitularTarjeta;
            IF COL_LENGTH('Clientes', 'FechaExpiracionTarjeta') IS NOT NULL
                ALTER TABLE Clientes DROP COLUMN FechaExpiracionTarjeta;
            IF COL_LENGTH('Clientes', 'TipoTarjeta') IS NOT NULL
                ALTER TABLE Clientes DROP COLUMN TipoTarjeta;

            IF COL_LENGTH('Empleados', 'PasswordHash') IS NULL
                ALTER TABLE Empleados ADD PasswordHash varchar(500) NULL;
            IF COL_LENGTH('Empleados', 'Rol') IS NULL
                ALTER TABLE Empleados ADD Rol varchar(30) NOT NULL
                    CONSTRAINT DF_Empleados_Rol DEFAULT 'Empleado';

            UPDATE Empleados
            SET Usuario = CONCAT('empleado-', Id)
            WHERE Usuario IS NULL OR LTRIM(RTRIM(Usuario)) = '';

            UPDATE Empleados
            SET Usuario = CONCAT(LEFT(LOWER(LTRIM(RTRIM(Usuario))), 88), '-', Id)
            WHERE LEN(Usuario) > 100;

            ;WITH UsuariosDuplicados AS
            (
                SELECT Id,
                       ROW_NUMBER() OVER (PARTITION BY LOWER(Usuario) ORDER BY Id) AS Numero
                FROM Empleados
            )
            UPDATE empleado
            SET Usuario = CONCAT(LEFT(empleado.Usuario, 88), '-', empleado.Id)
            FROM Empleados AS empleado
            INNER JOIN UsuariosDuplicados AS duplicado ON duplicado.Id = empleado.Id
            WHERE duplicado.Numero > 1;

            ALTER TABLE Empleados ALTER COLUMN Usuario varchar(100) NOT NULL;

            IF NOT EXISTS
            (
                SELECT 1 FROM sys.indexes
                WHERE name = 'UX_Empleados_Usuario'
                  AND object_id = OBJECT_ID('Empleados')
            )
                CREATE UNIQUE INDEX UX_Empleados_Usuario ON Empleados(Usuario);

            IF EXISTS
            (
                SELECT IdVehiculo
                FROM Rentas
                GROUP BY IdVehiculo
                HAVING COUNT(*) > 1
            )
                THROW 51000, 'No se puede proteger Rentas: existen vehículos rentados más de una vez.', 1;

            IF NOT EXISTS
            (
                SELECT 1 FROM sys.indexes
                WHERE name = 'UX_Rentas_IdVehiculo'
                  AND object_id = OBJECT_ID('Rentas')
            )
                CREATE UNIQUE INDEX UX_Rentas_IdVehiculo ON Rentas(IdVehiculo);
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        throw new NotSupportedException(
            "SecurityHardening elimina datos de pago heredados y no admite reversión automática.");
    }
}
