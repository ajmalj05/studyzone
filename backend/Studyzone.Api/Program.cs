using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Studyzone.Infrastructure;
using Studyzone.Infrastructure.Persistence;

// Load .env from backend folder (parent of Studyzone.Api when running from project dir)
var envPath = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (!File.Exists(envPath))
    envPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".env");
if (File.Exists(envPath))
    DotNetEnv.Env.Load(envPath);

var builder = WebApplication.CreateBuilder(args);

// Coolify (and similar PaaS) set PORT; listen on 0.0.0.0 so the container accepts external requests
var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port) && int.TryParse(port, out var portNum))
    builder.WebHost.UseUrls($"http://0.0.0.0:{portNum}");

var conn = builder.Configuration["ConnectionStrings:DefaultConnection"];
if (string.IsNullOrWhiteSpace(conn))
    throw new InvalidOperationException("Missing required configuration: ConnectionStrings:DefaultConnection (set ConnectionStrings__DefaultConnection env var).");

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException("Missing required configuration: Jwt:Key (set Jwt__Key env var).");
if (string.IsNullOrWhiteSpace(jwtIssuer))
    throw new InvalidOperationException("Missing required configuration: Jwt:Issuer (set Jwt__Issuer env var).");
if (string.IsNullOrWhiteSpace(jwtAudience))
    throw new InvalidOperationException("Missing required configuration: Jwt:Audience (set Jwt__Audience env var).");

var corsOrigins = builder.Configuration["CORS:Origins"];
if (string.IsNullOrWhiteSpace(corsOrigins))
    throw new InvalidOperationException("Missing required configuration: CORS:Origins (set CORS__Origins env var, e.g. http://localhost:5173).");

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddInfrastructure(conn, builder.Configuration);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });
builder.Services.AddAuthorization();

var origins = corsOrigins.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
builder.Services.AddCors(o =>
{
    o.AddDefaultPolicy(p =>
    {
        p.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
    var seedAdminUserId = builder.Configuration["Seed:AdminUserId"];
    var seedAdminPassword = builder.Configuration["Seed:AdminPassword"];
    var seedAdminName = builder.Configuration["Seed:AdminName"];
    await SeedData.EnsureSeedAsync(db, seedAdminUserId, seedAdminPassword, seedAdminName);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Skip HTTPS redirect in production when behind a reverse proxy (e.g. Coolify); proxy handles TLS
if (app.Environment.IsDevelopment())
    app.UseHttpsRedirection();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
