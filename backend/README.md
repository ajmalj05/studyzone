# Studyzone Backend (.NET 10 LTS, Clean Architecture)

## Requirements

- **.NET 10 SDK** (https://dotnet.microsoft.com/download/dotnet/10.0)
- **PostgreSQL** (local or Docker)

## Configuration (env only, no hardcoding)

All credentials and config come from **environment variables**. No fallbacks; the app will throw at startup if required values are missing.

Set these before running (see `.env.example` for a template; copy to `.env` and load with your shell or IDE):

| Env var | Required | Description |
|--------|----------|-------------|
| `ConnectionStrings__DefaultConnection` | Yes | PostgreSQL connection string |
| `Jwt__Key` | Yes | JWT signing key (32+ chars for HS256) |
| `Jwt__Issuer` | Yes | JWT issuer |
| `Jwt__Audience` | Yes | JWT audience |
| `CORS__Origins` | Yes | Allowed origins, semicolon-separated (e.g. `http://localhost:5173`) |
| `Seed__AdminUserId` | No | Initial admin login id (only used when DB has no users) |
| `Seed__AdminPassword` | No | Initial admin password |
| `Seed__AdminName` | No | Initial admin display name |

If all three `Seed__*` are set, the first run will create one admin user when the database is empty.

## Structure

- **Studyzone.Domain** — Entities only (User, AcademicYear, School, etc.)
- **Studyzone.Application** — Interfaces, DTOs, use cases (no EF or infra)
- **Studyzone.Infrastructure** — EF Core, DbContext, repositories, JWT, auth service
- **Studyzone.Api** — Web API, controllers, JWT auth, CORS, Swagger

## Run

1. Set the required environment variables (see above). Example (PowerShell):
   ```powershell
   $env:ConnectionStrings__DefaultConnection = "Host=localhost;Database=studyzone;Username=postgres;Password=yourpassword"
   $env:Jwt__Key = "YourSecretKeyAtLeast32CharactersLong!!"
   $env:Jwt__Issuer = "Studyzone.Api"
   $env:Jwt__Audience = "Studyzone.App"
   $env:CORS__Origins = "http://localhost:5173"
   $env:Seed__AdminUserId = "admin"
   $env:Seed__AdminPassword = "your-admin-password"
   $env:Seed__AdminName = "Admin"
   ```

2. From `backend/`:
   ```bash
   dotnet run --project Studyzone.Api
   ```
   API: http://localhost:5000  
   Swagger: http://localhost:5000/swagger  

3. Log in with the seeded admin (UserId and password from `Seed__AdminUserId` / `Seed__AdminPassword`) on the Admin login page.

## Build

```bash
cd backend
dotnet build
```

## Troubleshooting

### "Application Control policy has blocked this file" (0x800711C7)

Windows is blocking execution of assemblies when the project lives under **`C:\Users\Public\Downloads\`** (or similar restricted paths). Unblocking files does not fix this.

**Fix: move the project** to a path under your user profile, then run from there:

```powershell
# Example: copy to a dev folder (adjust target as you like)
Copy-Item -Path "C:\Users\Public\Downloads\personal\Studyzone" -Destination "C:\Users\ajmal\source\Studyzone" -Recurse
cd C:\Users\ajmal\source\Studyzone\backend
dotnet run --project Studyzone.Api
```

Use your own username instead of `ajmal` if different. After moving, set env vars and run the API from the new location.
