using Microsoft.EntityFrameworkCore;
using RentCar.API.Domain;

namespace RentCar.API.Models;

public partial class RentCarDbContext : DbContext
{
    public RentCarDbContext()
    {
    }

    public RentCarDbContext(DbContextOptions<RentCarDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Cliente> Clientes { get; set; }
    public virtual DbSet<Empleado> Empleados { get; set; }
    public virtual DbSet<Inspeccione> Inspecciones { get; set; }
    public virtual DbSet<Marca> Marcas { get; set; }
    public virtual DbSet<Modelo> Modelos { get; set; }
    public virtual DbSet<Renta> Rentas { get; set; }
    public virtual DbSet<TiposCombustible> TiposCombustibles { get; set; }
    public virtual DbSet<TiposVehiculo> TiposVehiculos { get; set; }
    public virtual DbSet<Vehiculo> Vehiculos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).HasMaxLength(150).IsUnicode(false);
            entity.Property(e => e.Cedula).HasMaxLength(11).IsUnicode(false);
            entity.Property(e => e.LimiteCredito).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.UltimosDigitosTarjeta)
                .HasMaxLength(4)
                .IsUnicode(false)
                .HasColumnName("NoTarjetaCR");
            entity.Property(e => e.TipoTarjeta).HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.TipoPersona).HasMaxLength(20).IsUnicode(false);
            // Sin HasDefaultValue: en un bool no anulable EF omitiría el valor false
            // al insertar y la base aplicaría su default (true), reactivando registros.
            entity.HasIndex(e => e.Cedula).IsUnique();
        });

        modelBuilder.Entity<Empleado>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nombre).HasMaxLength(150);
            entity.Property(e => e.Cedula).HasMaxLength(11).IsUnicode(false);
            entity.Property(e => e.TandaLabor).HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.FechaIngreso).HasColumnType("datetime2");
            entity.Property(e => e.Usuario).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.PasswordHash).HasMaxLength(512);
            entity.HasIndex(e => e.Cedula).IsUnique();
            entity.HasIndex(e => e.Usuario).IsUnique();
        });

        modelBuilder.Entity<Inspeccione>(entity =>
        {
            entity.HasKey(e => e.IdTransaccion);
            entity.Property(e => e.CantidadCombustible).HasMaxLength(20).IsUnicode(false);
            entity.Property(e => e.Fecha).HasColumnType("datetime2");

            entity.HasOne<Vehiculo>().WithMany()
                .HasForeignKey(e => e.IdVehiculo)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Cliente>().WithMany()
                .HasForeignKey(e => e.IdCliente)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Empleado>().WithMany()
                .HasForeignKey(e => e.IdEmpleadoInspeccion)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Marca>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(true);
        });

        modelBuilder.Entity<Modelo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(true);
            entity.HasOne(d => d.IdMarcaNavigation)
                .WithMany(p => p.Modelos)
                .HasForeignKey(d => d.IdMarca)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Renta>(entity =>
        {
            entity.HasKey(e => e.NoRenta);
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_Rentas_Estado",
                $"[Estado] IN ('{EstadosRenta.Activa}', '{EstadosRenta.Concluida}')"));

            entity.Property(e => e.FechaRenta).HasColumnType("datetime2");
            entity.Property(e => e.FechaDevolucion).HasColumnType("datetime2");
            entity.Property(e => e.MontoXdia).HasColumnType("decimal(18, 2)").HasColumnName("MontoXDia");
            entity.Property(e => e.Subtotal).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Itbis).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Total).HasColumnType("decimal(18, 2)");
            entity.Property(e => e.Comentario).HasMaxLength(1000);
            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false)
                // Una devolución concurrente sobre la misma renta solo puede ganar una vez.
                .IsConcurrencyToken();

            entity.HasOne<Empleado>().WithMany()
                .HasForeignKey(e => e.IdEmpleado)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Vehiculo>().WithMany()
                .HasForeignKey(e => e.IdVehiculo)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Cliente>().WithMany()
                .HasForeignKey(e => e.IdCliente)
                .OnDelete(DeleteBehavior.Restrict);

            // Defensa en base de datos contra doble alquiler simultáneo:
            // un vehículo no puede tener dos rentas activas a la vez.
            entity.HasIndex(e => e.IdVehiculo)
                .IsUnique()
                .HasFilter($"[Estado] = '{EstadosRenta.Activa}'")
                .HasDatabaseName("UX_Rentas_IdVehiculo_Activa");
        });

        modelBuilder.Entity<TiposCombustible>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(true);
        });

        modelBuilder.Entity<TiposVehiculo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Descripcion).HasMaxLength(100).IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(true);
        });

        modelBuilder.Entity<Vehiculo>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.ToTable(table => table.HasCheckConstraint(
                "CK_Vehiculos_EstadoOperacion",
                $"[EstadoOperacion] IN ('{EstadosVehiculo.Disponible}', '{EstadosVehiculo.Rentado}', '{EstadosVehiculo.NoDisponible}')"));

            entity.Property(e => e.Descripcion).HasMaxLength(200);
            entity.Property(e => e.NoPlaca).HasMaxLength(7).IsUnicode(false);
            entity.Property(e => e.NoChasis).HasMaxLength(17).IsUnicode(false);
            entity.Property(e => e.NoMotor).HasMaxLength(50).IsUnicode(false);
            entity.Property(e => e.ImagenUrl).HasMaxLength(300).IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(true);
            entity.Property(e => e.EstadoOperacion)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue(EstadosVehiculo.Disponible)
                // Token de concurrencia optimista: el UPDATE que marca el vehículo como
                // Rentado incluye "WHERE EstadoOperacion = 'Disponible'"; si otra solicitud
                // lo alquiló primero, EF lanza DbUpdateConcurrencyException y no se duplica.
                .IsConcurrencyToken();

            entity.HasOne<Marca>().WithMany()
                .HasForeignKey(e => e.IdMarca)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<Modelo>().WithMany()
                .HasForeignKey(e => e.IdModelo)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<TiposVehiculo>().WithMany()
                .HasForeignKey(e => e.IdTipoVehiculo)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<TiposCombustible>().WithMany()
                .HasForeignKey(e => e.IdTipoCombustible)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.NoPlaca).IsUnique();
            entity.HasIndex(e => e.NoChasis)
                .IsUnique()
                .HasFilter("[NoChasis] IS NOT NULL");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
