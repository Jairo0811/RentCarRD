namespace RentCar.API.Migrations;

/// <summary>
/// Generadores de SQL Server idempotente para las migraciones de RentCarRD.
///
/// El esquema histórico se creó con scripts manuales (RentCarDB.sql) y luego con
/// migraciones parciales, de modo que cada base existente puede estar en un punto distinto.
/// Estas sentencias convergen cualquier base (nueva, creada con el script o modificada a mano)
/// al esquema del modelo, sin eliminar columnas ni registros. Las sentencias que dependen de
/// columnas que podrían no existir se ejecutan con EXEC para que SQL Server no las compile antes
/// de comprobar su existencia. Ante datos que violarían una restricción se lanza un error
/// explícito (THROW) y la migración se revierte: nunca se corrigen datos en silencio.
/// </summary>
internal static class SqlIdempotente
{
    public static string Literal(string valor) => valor.Replace("'", "''");

    public static string AgregarColumna(string tabla, string columna, string definicion) => $"""
        IF COL_LENGTH(N'dbo.{tabla}', N'{columna}') IS NULL
            EXEC(N'ALTER TABLE [dbo].[{tabla}] ADD [{columna}] {Literal(definicion)};');
        """;

    public static string RenombrarColumna(string tabla, string anterior, string nueva) => $"""
        IF COL_LENGTH(N'dbo.{tabla}', N'{anterior}') IS NOT NULL AND COL_LENGTH(N'dbo.{tabla}', N'{nueva}') IS NULL
            EXEC sp_rename N'dbo.{tabla}.{anterior}', N'{nueva}', N'COLUMN';
        """;

    /// <summary>Ejecuta la sentencia solo si todas las columnas indicadas existen.</summary>
    public static string SiExistenColumnas(string tabla, string[] columnas, string sentencia)
    {
        var condicion = string.Join(" AND ", columnas.Select(c => $"COL_LENGTH(N'dbo.{tabla}', N'{c}') IS NOT NULL"));
        return $"""
            IF {condicion}
                EXEC(N'{Literal(sentencia)}');
            """;
    }

    /// <summary>
    /// Cambia el tipo de una columna eliminando y recreando su DEFAULT si lo tiene
    /// (SQL Server no permite ALTER COLUMN con un DEFAULT dependiente).
    /// </summary>
    public static string CambiarTipo(string tabla, string columna, string tipoNuevo, string? defaultNuevo, string condicionCambio) => $"""
        IF COL_LENGTH(N'dbo.{tabla}', N'{columna}') IS NOT NULL AND ({condicionCambio})
        BEGIN
            DECLARE @df_{tabla}_{columna} sysname = (
                SELECT dc.name FROM sys.default_constraints dc
                JOIN sys.columns c ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
                WHERE dc.parent_object_id = OBJECT_ID(N'dbo.{tabla}') AND c.name = N'{columna}');
            IF @df_{tabla}_{columna} IS NOT NULL
                EXEC(N'ALTER TABLE [dbo].[{tabla}] DROP CONSTRAINT [' + @df_{tabla}_{columna} + N']');
            EXEC(N'ALTER TABLE [dbo].[{tabla}] ALTER COLUMN [{columna}] {Literal(tipoNuevo)};');
            {(defaultNuevo is null ? string.Empty : $"EXEC(N'ALTER TABLE [dbo].[{tabla}] ADD CONSTRAINT [DF_{tabla}_{columna}] DEFAULT {Literal(defaultNuevo)} FOR [{columna}];');")}
        END
        """;

    /// <summary>
    /// Índice único si no existe ya un índice/constraint único cuya clave sea exactamente esa columna
    /// (un índice único sin filtro existente es igual o más estricto y se respeta).
    /// </summary>
    public static string IndiceUnico(string tabla, string columna, string nombre, string? filtro, string mensajeDuplicados)
    {
        var where = filtro is null ? string.Empty : $" WHERE {filtro}";
        var condicionDuplicados = filtro is null ? string.Empty : $" WHERE {filtro}";
        return $"""
            IF NOT EXISTS (
                SELECT 1 FROM sys.indexes i
                JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.key_ordinal = 1
                JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                WHERE i.object_id = OBJECT_ID(N'dbo.{tabla}') AND i.is_unique = 1 AND c.name = N'{columna}'
                  AND (SELECT COUNT(*) FROM sys.index_columns x WHERE x.object_id = i.object_id AND x.index_id = i.index_id AND x.key_ordinal > 0) = 1)
            BEGIN
                IF EXISTS (SELECT [{columna}] FROM [dbo].[{tabla}]{condicionDuplicados} GROUP BY [{columna}] HAVING COUNT(*) > 1)
                    THROW 50001, N'{Literal(mensajeDuplicados)}', 1;
                EXEC(N'CREATE UNIQUE NONCLUSTERED INDEX [{nombre}] ON [dbo].[{tabla}] ([{columna}]){Literal(where)};');
            END
            """;
    }

    /// <summary>Índice no único para una columna de clave foránea si ningún índice la tiene como primera clave.</summary>
    public static string IndiceSimple(string tabla, string columna) => $"""
        IF NOT EXISTS (
            SELECT 1 FROM sys.index_columns ic
            JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
            WHERE ic.object_id = OBJECT_ID(N'dbo.{tabla}') AND ic.key_ordinal = 1 AND c.name = N'{columna}')
            EXEC(N'CREATE NONCLUSTERED INDEX [IX_{tabla}_{columna}] ON [dbo].[{tabla}] ([{columna}]);');
        """;

    /// <summary>Clave foránea si la columna aún no participa en ninguna; falla ante registros huérfanos.</summary>
    public static string ClaveForanea(string tabla, string columna, string tablaReferencia, string columnaReferencia = "Id") => $"""
        IF NOT EXISTS (
            SELECT 1 FROM sys.foreign_key_columns fkc
            JOIN sys.columns c ON c.object_id = fkc.parent_object_id AND c.column_id = fkc.parent_column_id
            WHERE fkc.parent_object_id = OBJECT_ID(N'dbo.{tabla}') AND c.name = N'{columna}')
        BEGIN
            IF EXISTS (
                SELECT 1 FROM [dbo].[{tabla}] t
                WHERE t.[{columna}] IS NOT NULL
                  AND NOT EXISTS (SELECT 1 FROM [dbo].[{tablaReferencia}] r WHERE r.[{columnaReferencia}] = t.[{columna}]))
                THROW 50002, N'Integridad referencial: {tabla}.{columna} contiene valores que no existen en {tablaReferencia}. Corrija esos registros (o restaure el respaldo) antes de aplicar la migración.', 1;
            EXEC(N'ALTER TABLE [dbo].[{tabla}] WITH CHECK ADD CONSTRAINT [FK_{tabla}_{tablaReferencia}_{columna}] FOREIGN KEY ([{columna}]) REFERENCES [dbo].[{tablaReferencia}] ([{columnaReferencia}]);');
        END
        """;

    /// <summary>Restricción CHECK si no existe; falla si hay datos que la violarían.</summary>
    public static string Check(string tabla, string nombre, string expresion, string condicionInvalida, string mensaje) => $"""
        IF OBJECT_ID(N'dbo.{nombre}', N'C') IS NULL
        BEGIN
            IF EXISTS (SELECT 1 FROM [dbo].[{tabla}] WHERE {condicionInvalida})
                THROW 50003, N'{Literal(mensaje)}', 1;
            EXEC(N'ALTER TABLE [dbo].[{tabla}] WITH CHECK ADD CONSTRAINT [{nombre}] CHECK ({Literal(expresion)});');
        END
        """;
}
