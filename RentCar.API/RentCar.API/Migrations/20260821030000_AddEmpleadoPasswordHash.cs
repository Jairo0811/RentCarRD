using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RentCar.API.Migrations;

public partial class AddEmpleadoPasswordHash : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "PasswordHash", table: "Empleados", type: "nvarchar(512)", maxLength: 512, nullable: false, defaultValue: "");
        migrationBuilder.Sql("UPDATE Clientes SET NoTarjetaCr = CASE WHEN NoTarjetaCr IS NULL THEN NULL ELSE RIGHT(NoTarjetaCr, 4) END, NombreTitularTarjeta = NULL, FechaExpiracionTarjeta = NULL;");
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropColumn(name: "PasswordHash", table: "Empleados");
}
