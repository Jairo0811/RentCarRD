using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RentCar.API.Models;

#nullable disable

namespace RentCar.API.Migrations;

/// <summary>
/// v1.2.1: esta migración existía desde v1.2 pero carecía de los atributos [DbContext] y
/// [Migration], por lo que EF Core nunca la descubría ni la aplicaba. Ahora es descubrible e
/// idempotente (no falla si la columna se agregó manualmente). El enmascaramiento de tarjetas
/// que contenía se ejecuta, de forma completa y verificable, en V121IntegridadYPrivacidad.
/// </summary>
[DbContext(typeof(RentCarDbContext))]
[Migration("20260821030000_AddEmpleadoPasswordHash")]
public partial class AddEmpleadoPasswordHash : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(SqlIdempotente.AgregarColumna(
            "Empleados", "PasswordHash", "nvarchar(512) NOT NULL CONSTRAINT [DF_Empleados_PasswordHash] DEFAULT N''"));
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropColumn(name: "PasswordHash", table: "Empleados");
}
