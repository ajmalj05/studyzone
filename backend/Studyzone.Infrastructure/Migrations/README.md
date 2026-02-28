# Migrations

The app uses **EF Core migrations** (startup calls `MigrateAsync()`).

Apply migrations by running the app, or manually:

```bash
dotnet ef database update --project Studyzone.Infrastructure --startup-project Studyzone.Api
```

Add a new migration after model changes:

```bash
dotnet ef migrations add YourMigrationName --project Studyzone.Infrastructure --startup-project Studyzone.Api
```
