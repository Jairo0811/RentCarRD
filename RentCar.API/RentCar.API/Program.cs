using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RentCar.API.Auth;
using RentCar.API.Models;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "ConnectionStrings:DefaultConnection debe configurarse mediante appsettings.Development.json, User Secrets o variables de entorno.");
}

builder.Services.AddControllers();
builder.Services.AddProblemDetails();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Falta la configuración JWT.");

if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
{
    throw new InvalidOperationException(
        "Jwt:Key debe configurarse fuera del repositorio y tener al menos 32 caracteres.");
}

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?.Where(origin => !string.IsNullOrWhiteSpace(origin))
    .ToArray() ?? [];

if (allowedOrigins.Length == 0)
{
    throw new InvalidOperationException(
        "Cors:AllowedOrigins debe contener al menos un origen confiable.");
}

if (!builder.Environment.IsDevelopment())
{
    if (string.Equals(builder.Configuration["AllowedHosts"], "*", StringComparison.Ordinal))
    {
        throw new InvalidOperationException(
            "AllowedHosts debe restringirse al dominio público en producción.");
    }

    if (allowedOrigins.Any(origin => !origin.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
    {
        throw new InvalidOperationException(
            "Todos los orígenes CORS deben utilizar HTTPS en producción.");
    }
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddScoped<IPasswordHasher<Empleado>, PasswordHasher<Empleado>>();
builder.Services.AddScoped<TokenService>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<RentCarDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader());
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 120,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                Window = TimeSpan.FromMinutes(10),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

if (builder.Configuration.GetValue<bool>("Database:MigrateOnStartup"))
{
    await using var migrationScope = app.Services.CreateAsyncScope();
    var db = migrationScope.ServiceProvider.GetRequiredService<RentCarDbContext>();
    await db.Database.MigrateAsync();
}

// Inicialización opcional y de una sola vez del administrador.
// Defina RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD únicamente para el primer arranque.
using (var scope = app.Services.CreateScope())
{
    var bootstrapPassword = builder.Configuration["RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD"];
    if (!string.IsNullOrWhiteSpace(bootstrapPassword))
    {
        if (bootstrapPassword.Length < 12)
        {
            throw new InvalidOperationException(
                "La contraseña bootstrap debe tener al menos 12 caracteres.");
        }

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

app.UseExceptionHandler();
app.UseHttpsRedirection();

app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "no-referrer";
    context.Response.Headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
    await next();
});

app.UseStaticFiles();
app.UseCors("AllowAngularApp");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new
{
    service = "RentCarRD.Api",
    status = "Healthy",
    utc = DateTime.UtcNow
})).AllowAnonymous();

app.MapControllers();
app.Run();

public partial class Program;
