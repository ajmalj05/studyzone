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

builder.Services.AddInfrastructure(conn);

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

async Task EnsureMigrationHistoryBaselineAsync(ApplicationDbContext db)
{
    await db.Database.ExecuteSqlRawAsync(@"
CREATE TABLE IF NOT EXISTS ""__EFMigrationsHistory"" (
  ""MigrationId"" varchar(150) NOT NULL PRIMARY KEY,
  ""ProductVersion"" varchar(32) NOT NULL
);");
    var historyCount = await db.Database.SqlQueryRaw<int>(
        @"SELECT COUNT(*) AS ""Value"" FROM ""__EFMigrationsHistory""").FirstOrDefaultAsync();
    if (historyCount != 0) return;
    var hasAcademicYears = await db.Database.SqlQueryRaw<int>(
        @"SELECT COUNT(*) AS ""Value"" FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'AcademicYears'").FirstOrDefaultAsync();
    if (hasAcademicYears == 0) return;
    await db.Database.ExecuteSqlRawAsync(@"
INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"") VALUES
  ('20260228115049_AddAnnouncements', '10.0.0'),
  ('20260228122352_AddTeacherSalary', '10.0.0'),
  ('20260228140000_AddBatchIdToApplication', '10.0.0')
ON CONFLICT (""MigrationId"") DO NOTHING;");
}

async Task EnsureMissingSchemaPartsAsync(ApplicationDbContext db)
{
    await db.Database.ExecuteSqlRawAsync(@"
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Applications' AND column_name = 'BatchId'
  ) THEN
    ALTER TABLE ""Applications"" ADD COLUMN ""BatchId"" uuid NULL;
  END IF;
END $$;");
    await db.Database.ExecuteSqlRawAsync(@"
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PortalRequests') THEN
    CREATE TABLE ""PortalRequests"" (
      ""Id"" uuid NOT NULL,
      ""UserId"" uuid NOT NULL,
      ""Role"" text NOT NULL,
      ""RequestType"" text NOT NULL,
      ""Subject"" text NOT NULL,
      ""Message"" text NOT NULL,
      ""Status"" text NOT NULL,
      ""AdminComment"" text NULL,
      ""CreatedAt"" timestamp with time zone NOT NULL,
      ""UpdatedAt"" timestamp with time zone NULL,
      CONSTRAINT ""PK_PortalRequests"" PRIMARY KEY (""Id"")
    );
    CREATE INDEX ""IX_PortalRequests_UserId"" ON ""PortalRequests"" (""UserId"");
    CREATE INDEX ""IX_PortalRequests_Role"" ON ""PortalRequests"" (""Role"");
    CREATE INDEX ""IX_PortalRequests_Status"" ON ""PortalRequests"" (""Status"");
  END IF;
END $$;");
    await db.Database.ExecuteSqlRawAsync(@"
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Notifications') THEN
    CREATE TABLE ""Notifications"" (
      ""Id"" uuid NOT NULL,
      ""UserId"" uuid NOT NULL,
      ""Type"" text NOT NULL,
      ""Title"" text NOT NULL,
      ""RelatedEntityId"" uuid NULL,
      ""CreatedAt"" timestamp with time zone NOT NULL,
      CONSTRAINT ""PK_Notifications"" PRIMARY KEY (""Id"")
    );
    CREATE INDEX ""IX_Notifications_UserId"" ON ""Notifications"" (""UserId"");
    CREATE INDEX ""IX_Notifications_CreatedAt"" ON ""Notifications"" (""CreatedAt"");
  END IF;
END $$;");
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await EnsureMigrationHistoryBaselineAsync(db);
    await db.Database.MigrateAsync();
    await EnsureMissingSchemaPartsAsync(db);
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
