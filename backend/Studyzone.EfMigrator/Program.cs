// Design-time host for Entity Framework CLI only.
// Run from this folder, for example:
//   dotnet ef database update --project ..\Studyzone.Infrastructure\Studyzone.Infrastructure.csproj --startup-project Studyzone.EfMigrator.csproj
// Optional: --connection "Host=...;Database=...;Username=...;Password=..."

namespace Studyzone.EfMigrator;

public static class Program
{
    public static void Main(string[] args)
    {
        _ = args;
    }
}
