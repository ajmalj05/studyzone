using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class SiblingGroupRepository : ISiblingGroupRepository
{
    private readonly ApplicationDbContext _db;

    public SiblingGroupRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<SiblingGroup?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.SiblingGroups.FindAsync(new object[] { id }, ct);
    }

    public async Task<SiblingGroup> AddAsync(SiblingGroup entity, CancellationToken ct = default)
    {
        _db.SiblingGroups.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }
}
