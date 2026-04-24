using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Studyzone.Infrastructure.Persistence;

/// <summary>
/// Used by <c>dotnet ef</c> when the migrations assembly is loaded from a separate startup project
/// (e.g. <c>Studyzone.EfMigrator</c>). Connection string is design-time only; runtime uses API configuration.
/// Set <c>ConnectionStrings__DefaultConnection</c> or pass <c>--connection</c> to <c>dotnet ef database update</c>.
/// </summary>
public class ApplicationDbContextDesignTimeFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        var cs =
            Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable("EF_CONNECTION_STRING")
            ?? "Host=127.0.0.1;Database=studyzone;Username=postgres;Password=postgres";
        optionsBuilder.UseNpgsql(cs);
        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
