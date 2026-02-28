using Microsoft.EntityFrameworkCore;
using Studyzone.Domain.Entities;

namespace Studyzone.Infrastructure.Persistence;

public static class SeedData
{
    /// <summary>
    /// Seeds roles and optionally one admin user when db has no users.
    /// Admin is only created when all of adminUserId, adminPassword, adminName are non-empty (e.g. from Seed__AdminUserId, Seed__AdminPassword, Seed__AdminName env vars).
    /// </summary>
    public static async Task EnsureSeedAsync(ApplicationDbContext db, string? adminUserId, string? adminPassword, string? adminName)
    {
        await SeedRolesAsync(db);
        if (!string.IsNullOrWhiteSpace(adminUserId) && !string.IsNullOrWhiteSpace(adminPassword) && !string.IsNullOrWhiteSpace(adminName))
            await SeedAdminUserAsync(db, adminUserId.Trim(), adminPassword, adminName.Trim());
    }

    private static async Task SeedRolesAsync(ApplicationDbContext db)
    {
        if (await db.Roles.AnyAsync())
            return;
        var roleNames = new[] { "Super Admin", "Admin", "Teacher", "Accountant", "Receptionist" };
        foreach (var name in roleNames)
        {
            var role = new Role
            {
                Id = Guid.NewGuid(),
                Name = name,
                Description = $"{name} role",
                CreatedAt = DateTime.UtcNow
            };
            db.Roles.Add(role);
        }
        await db.SaveChangesAsync();
    }

    private static async Task SeedAdminUserAsync(ApplicationDbContext db, string adminUserId, string adminPassword, string adminName)
    {
        if (await db.Users.AnyAsync(u => u.UserId == adminUserId))
            return;
        var hash = BCrypt.Net.BCrypt.HashPassword(adminPassword);
        db.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            UserId = adminUserId,
            PasswordHash = hash,
            Name = adminName,
            Role = "admin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }
}
