using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

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
            entity.Property(e => e.LimiteCredito).HasColumnType("decimal(18, 2)");
        });

        modelBuilder.Entity<Inspeccione>(entity =>
        {
            entity.HasKey(e => e.IdTransaccion);
        });

        modelBuilder.Entity<Marca>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Marcas__3214EC0715E99AF7");

            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(true);
        });

        modelBuilder.Entity<Modelo>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Modelos__3214EC073EC5E5C6");

            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(true);

            entity.HasOne(d => d.IdMarcaNavigation).WithMany(p => p.Modelos)
                .HasForeignKey(d => d.IdMarca)
                .HasConstraintName("FK__Modelos__IdMarca__628FA481");
        });

        modelBuilder.Entity<Renta>(entity =>
        {
            entity.HasKey(e => e.NoRenta);

            entity.Property(e => e.MontoXdia)
                .HasColumnType("decimal(18, 2)")
                .HasColumnName("MontoXDia");
        });

        modelBuilder.Entity<TiposCombustible>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TiposCom__3214EC070B4B06BB");

            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(true);
        });

        modelBuilder.Entity<TiposVehiculo>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__TiposVeh__3214EC079E7BF2EF");

            entity.Property(e => e.Descripcion)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.Estado).HasDefaultValue(true);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}