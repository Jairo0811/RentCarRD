using Microsoft.EntityFrameworkCore;

namespace RentCar.API.Models;

public partial class RentCarDbContext : DbContext
{
    public RentCarDbContext()
    {
    }

    public RentCarDbContext(
        DbContextOptions<RentCarDbContext> options)
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

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Nombre)
                .HasMaxLength(150)
                .IsUnicode(false);

            entity.Property(e => e.Cedula)
                .HasMaxLength(11)
                .IsUnicode(false);

            entity.Property(e => e.LimiteCredito)
                .HasColumnType("decimal(18, 2)");

            entity.Property(e => e.NoTarjetaCr)
                .HasMaxLength(19)
                .IsUnicode(false)
                .HasColumnName("NoTarjetaCR");

            entity.Property(e => e.NombreTitularTarjeta)
                .HasMaxLength(120)
                .IsUnicode(false);

            entity.Property(e => e.FechaExpiracionTarjeta)
                .HasMaxLength(5)
                .IsUnicode(false);

            entity.Property(e => e.TipoTarjeta)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.Property(e => e.TipoPersona)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.Property(e => e.Estado)
                .HasDefaultValue(true);

            entity.HasIndex(e => e.Cedula)
                .IsUnique();
        });

        modelBuilder.Entity<Empleado>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Nombre)
                .HasMaxLength(150);

            entity.Property(e => e.Cedula)
                .HasMaxLength(11)
                .IsUnicode(false);

            entity.Property(e => e.Usuario)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.HasIndex(e => e.Cedula)
                .IsUnique();

            entity.HasIndex(e => e.Usuario)
                .IsUnique();
        });

        modelBuilder.Entity<Inspeccione>(entity =>
        {
            entity.HasKey(e => e.IdTransaccion);
        });

        modelBuilder.Entity<Marca>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.Property(e => e.Estado)
                .HasDefaultValue(true);
        });

        modelBuilder.Entity<Modelo>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.Property(e => e.Estado)
                .HasDefaultValue(true);

            entity.HasOne(d => d.IdMarcaNavigation)
                .WithMany(p => p.Modelos)
                .HasForeignKey(d => d.IdMarca);
        });

        modelBuilder.Entity<Renta>(entity =>
        {
            entity.HasKey(e => e.NoRenta);

            entity.Property(e => e.FechaRenta)
                .HasColumnType("datetime2");

            entity.Property(e => e.FechaDevolucion)
                .HasColumnType("datetime2");

            entity.Property(e => e.MontoXdia)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("MontoXDia");

            entity.Property(e => e.Total)
                .HasColumnType("decimal(18, 2)");

            entity.Property(e => e.Comentario)
                .HasMaxLength(1000);

            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .IsUnicode(false);
        });

        modelBuilder.Entity<TiposCombustible>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.Property(e => e.Estado)
                .HasDefaultValue(true);
        });

        modelBuilder.Entity<TiposVehiculo>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false);

            entity.Property(e => e.Estado)
                .HasDefaultValue(true);
        });

        modelBuilder.Entity<Vehiculo>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Descripcion)
                .HasMaxLength(200);

            entity.Property(e => e.NoPlaca)
                .HasMaxLength(7)
                .IsUnicode(false);

            entity.Property(e => e.NoChasis)
                .HasMaxLength(17)
                .IsUnicode(false);

            entity.Property(e => e.NoMotor)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.Property(e => e.ImagenUrl)
                .HasMaxLength(300)
                .IsUnicode(false);

            entity.Property(e => e.Estado)
                .HasDefaultValue(true);

            entity.Property(e => e.EstadoOperacion)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Disponible");

            entity.HasIndex(e => e.NoPlaca)
                .IsUnique();

            entity.HasIndex(e => e.NoChasis)
                .IsUnique()
                .HasFilter("[NoChasis] IS NOT NULL");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(
        ModelBuilder modelBuilder);
}