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
            // v1.2.1: idempotente. En bases nuevas la columna ya la crea EsquemaBase;
            // en bases históricas se agrega como en la versión original.
            migrationBuilder.Sql(SqlIdempotente.AgregarColumna(
                "Empleados", "Usuario", "nvarchar(max) NOT NULL CONSTRAINT [DF_Empleados_Usuario] DEFAULT N''"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Usuario",
                table: "Empleados");
        }
    }
}
