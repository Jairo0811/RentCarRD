using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using RentCar.API.Auth;
using RentCar.API.Domain;
using RentCar.API.Infrastructure;
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
builder.Services.AddExceptionHandler<DbExceptionHandler>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddSingleton<IFechaNegocio, FechaNegocio>();
builder.Services.AddSingleton<AlmacenImagenesVehiculos>();

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

        // El token por sí solo no basta: en cada solicitud se comprueba que el empleado
        // siga existiendo, esté activo y conserve el rol firmado. Un empleado inactivado
        // pierde el acceso de inmediato aunque su JWT aún no haya expirado.
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var empleadoId = context.Principal?.EmpleadoId();
                if (empleadoId is null)
                {
                    context.Fail("El token no identifica a un empleado.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<RentCarDbContext>();
                var empleado = await db.Empleados
                    .AsNoTracking()
                    .Where(e => e.Id == empleadoId)
                    .Select(e => new { e.Estado, e.Usuario })
                    .SingleOrDefaultAsync(context.HttpContext.RequestAborted);

                if (empleado is null || !empleado.Estado)
                {
                    context.Fail("El empleado no existe o está inactivo.");
                    return;
                }

                if (!context.Principal!.IsInRole(Roles.ParaUsuario(empleado.Usuario)))
                {
                    context.Fail("El rol del token ya no corresponde al empleado.");
                }
            }
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

// Valores por defecto de v1.2; configurables solo para el entorno de pruebas automatizadas.
var limiteGlobal = builder.Configuration.GetValue("RateLimiting:GlobalPermitLimit", 120);
var limiteAutenticacion = builder.Configuration.GetValue("RateLimiting:AuthPermitLimit", 8);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = limiteGlobal,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = limiteAutenticacion,
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
// - Si existe "admin" sin PasswordHash, se le asigna la contraseña.
// - Si no existe ningún "admin" (instalación nueva), se crea con la cédula indicada en
//   RENTCARRD_BOOTSTRAP_ADMIN_CEDULA. Nunca sobrescribe una contraseña existente.
{
    var bootstrapPassword = builder.Configuration["RENTCARRD_BOOTSTRAP_ADMIN_PASSWORD"];
    if (!string.IsNullOrWhiteSpace(bootstrapPassword))
    {
        if (bootstrapPassword.Length < 12)
        {
            throw new InvalidOperationException(
                "La contraseña bootstrap debe tener al menos 12 caracteres.");
        }

        await using var scope = app.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<RentCarDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<Empleado>>();
        var admin = await db.Empleados.SingleOrDefaultAsync(e => e.Usuario == Roles.UsuarioAdministrador);

        if (admin is null)
        {
            var cedula = DocumentosDominicanos.SoloDigitos(builder.Configuration["RENTCARRD_BOOTSTRAP_ADMIN_CEDULA"]);
            if (!DocumentosDominicanos.CedulaValida(cedula))
            {
                throw new InvalidOperationException(
                    "Para crear el administrador inicial defina RENTCARRD_BOOTSTRAP_ADMIN_CEDULA con una cédula válida.");
            }

            admin = new Empleado
            {
                Nombre = "Administrador General",
                Cedula = cedula,
                TandaLabor = "Matutina",
                PorcientoComision = 0,
                FechaIngreso = DateTime.Today,
                Estado = true,
                Usuario = Roles.UsuarioAdministrador
            };
            admin.PasswordHash = hasher.HashPassword(admin, bootstrapPassword);
            db.Empleados.Add(admin);
            await db.SaveChangesAsync();
        }
        else if (string.IsNullOrWhiteSpace(admin.PasswordHash))
        {
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
