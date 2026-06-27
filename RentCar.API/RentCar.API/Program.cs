using Microsoft.EntityFrameworkCore;
using RentCar.API.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Agregar los Controladores
builder.Services.AddControllers();

// 2. Configurar Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. Configurar Entity Framework y SQL Server
builder.Services.AddDbContext<RentCarDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 4. Configurar CORS (Permitir que Angular se conecte)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy => policy.AllowAnyOrigin()
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

var app = builder.Build();

// 5. Configurar el entorno HTTP (Pipeline)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 6. Activar CORS ANTES de la Autorización
app.UseCors("AllowAngularApp");

app.UseAuthorization();
app.UseStaticFiles();

// 7. Mapear los controladores
app.MapControllers();

app.Run();