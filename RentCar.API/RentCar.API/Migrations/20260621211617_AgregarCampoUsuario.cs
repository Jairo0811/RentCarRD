using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentCar.API.Migrations
{
    /// <inheritdoc />
    public partial class AgregarCampoUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH('dbo.Empleados', 'Usuario') IS NULL
                    ALTER TABLE dbo.Empleados ADD Usuario varchar(100) NULL;

                UPDATE dbo.Empleados
                SET Usuario = CONCAT('empleado-', Id)
                WHERE Usuario IS NULL OR LTRIM(RTRIM(Usuario)) = '';

                UPDATE dbo.Empleados
                SET Usuario = CONCAT(LEFT(LOWER(LTRIM(RTRIM(Usuario))), 88), '-', Id)
                WHERE LEN(Usuario) > 100;

                ;WITH UsuariosDuplicados AS
                (
                    SELECT Id,
                           ROW_NUMBER() OVER (PARTITION BY LOWER(Usuario) ORDER BY Id) AS Numero
                    FROM dbo.Empleados
                )
                UPDATE empleado
                SET Usuario = CONCAT(LEFT(empleado.Usuario, 88), '-', empleado.Id)
                FROM dbo.Empleados AS empleado
                INNER JOIN UsuariosDuplicados AS duplicado ON duplicado.Id = empleado.Id
                WHERE duplicado.Numero > 1;

                ALTER TABLE dbo.Empleados ALTER COLUMN Usuario varchar(100) NOT NULL;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS
                (
                    SELECT 1 FROM sys.indexes
                    WHERE name = 'UX_Empleados_Usuario'
                      AND object_id = OBJECT_ID('dbo.Empleados')
                )
                    DROP INDEX UX_Empleados_Usuario ON dbo.Empleados;

                IF COL_LENGTH('dbo.Empleados', 'Usuario') IS NOT NULL
                    ALTER TABLE dbo.Empleados DROP COLUMN Usuario;
                """);
        }
    }
}
