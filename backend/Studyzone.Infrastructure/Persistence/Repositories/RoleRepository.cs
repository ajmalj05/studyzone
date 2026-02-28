using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly ApplicationDbContext _db;

    public RoleRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Role?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Roles
            .Include(x => x.Permissions)
            .FirstOrDefaultAsync(x => x.Id == id, ct);
    }

    public async Task<Role?> GetByNameAsync(string name, CancellationToken ct = default)
    {
        return await _db.Roles
            .Include(x => x.Permissions)
            .FirstOrDefaultAsync(x => x.Name == name, ct);
    }

    public async Task<IReadOnlyList<Role>> GetAllAsync(CancellationToken ct = default)
    {
        return await _db.Roles
            .Include(x => x.Permissions)
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .ToListAsync(ct);
    }

    public async Task<Role> AddAsync(Role entity, CancellationToken ct = default)
    {
        _db.Roles.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Role entity, CancellationToken ct = default)
    {
        var existing = await _db.Roles.Include(x => x.Permissions).FirstOrDefaultAsync(x => x.Id == entity.Id, ct);
        if (existing == null) return;
        _db.RolePermissions.RemoveRange(existing.Permissions);
        existing.Name = entity.Name;
        existing.Description = entity.Description;
        foreach (var p in entity.Permissions)
        {
            p.Id = Guid.NewGuid();
            p.RoleId = existing.Id;
            _db.RolePermissions.Add(p);
        }
        await _db.SaveChangesAsync(ct);
    }
}
