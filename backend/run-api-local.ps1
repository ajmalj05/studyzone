# Run Studyzone.Api on the host against Postgres from this repo's Docker Compose.
# Prerequisite: database container only — from this folder run:
#   docker compose up -d db
# Stop the compose "api" service if it is bound to port 5000 (docker compose stop api).

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ConnectionStrings__DefaultConnection = "Host=localhost;Database=studyzone;Username=postgres;Password=123456qw"
$env:Jwt__Key = "your-super-secret-development-key-must-be-32-chars!"
$env:Jwt__Issuer = "Studyzone.Api"
$env:Jwt__Audience = "Studyzone.App"
$env:CORS__Origins = "http://localhost:5173;http://127.0.0.1:5173;http://localhost:3000;http://127.0.0.1:3000;http://localhost:8080;http://127.0.0.1:8080"

dotnet run --project Studyzone.Api
