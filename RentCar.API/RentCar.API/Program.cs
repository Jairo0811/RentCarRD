using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using RentCar.API.Auth;
using RentCar.API.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Agregar los Controladores
builder.Services.AddControllers();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Falta la configuración JWT.");
if (jwt.Key.Length < 32) throw new InvalidOperationException("Jwt:Key debe tener al menos 32 caracteres.");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = jwt.Issuer,
        ValidateAudience = true, ValidAudience = jwt.Audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
        ValidateLifetime = true, ClockSkew = TimeSpan.FromSeconds(30)
    });
builder.Services.AddAuthorization(options =>
    options.FallbackPolicy = new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());
builder.Services.AddScoped<IPasswordHasher<Empleado>, PasswordHasher<Empleado>>();
builder.Services.AddScoped<TokenService>();

// 2. Configurar Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 3. Configurar Entity Framework y SQL Server
builder.Services.AddDbContext<RentCarDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// 4. Configurar CORS (Permitir que Angular se conecte)
builder.Services.AddCors(options =>
{
    var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    options.AddPolicy("AllowAngularApp",
        policy => policy.WithOrigins(origins)
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

var app = builder.Build();

// Inicialización de una sola vez: nunca existe una contraseña predeterminada.
// Defina RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD únicamente para el primer arranque.
using (var scope = app.Services.CreateScope())
{
    var bootstrapPassword = builder.Configuration["RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD"];
    if (!string.IsNullOrWhiteSpace(bootstrapPassword))
    {
        if (bootstrapPassword.Length < 12)
            throw new InvalidOperationException("La contraseña bootstrap debe tener al menos 12 caracteres.");
        var db = scope.ServiceProvider.GetRequiredService<RentCarDbContext>();
        var admin = await db.Empleados.SingleOrDefaultAsync(e => e.Usuario == "admin");
        if (admin is not null && string.IsNullOrWhiteSpace(admin.PasswordHash))
        {
            var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Empleado>>();
            admin.PasswordHash = hasher.HashPassword(admin, bootstrapPassword);
            await db.SaveChangesAsync();
        }
    }
}

// 5. Configurar el entorno HTTP (Pipeline)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 6. Activar CORS ANTES de la Autorización
app.UseCors("AllowAngularApp");

app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();

// 7. Mapear los controladores
app.MapControllers();

app.Run();
