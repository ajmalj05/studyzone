using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class StudentStatusHistoryRepository : IStudentStatusHistoryRepository
{
    private readonly ApplicationDbContext _db;

    public StudentStatusHistoryRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<StudentStatusHistory>> GetByStudentIdAsync(Guid studentId, CancellationToken ct = default)
    {
        return await _db.StudentStatusHistories.AsNoTracking().Where(x => x.StudentId == studentId).OrderByDescending(x => x.EffectiveDate).ToListAsync(ct);
    }

    public async Task AddAsync(StudentStatusHistory entity, CancellationToken ct = default)
    {
        _db.StudentStatusHistories.Add(entity);
        await _db.SaveChangesAsync(ct);
    }
}
