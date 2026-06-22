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
            // Solo agregamos la nueva columna a la tabla Empleados existente
            migrationBuilder.AddColumn<string>(
                name: "Usuario",
                table: "Empleados",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Solo removemos la columna en caso de querer revertir el proceso
            migrationBuilder.DropColumn(
                name: "Usuario",
                table: "Empleados");
        }
    }
}