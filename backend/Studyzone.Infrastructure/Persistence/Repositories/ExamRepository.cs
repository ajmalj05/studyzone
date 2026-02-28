using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class ExamRepository : IExamRepository
{
    private readonly ApplicationDbContext _db;

    public ExamRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Exam?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Exams.FindAsync(new object[] { id }, ct);
    }

    public async Task<IReadOnlyList<Exam>> GetAllAsync(Guid? classId, CancellationToken ct = default)
    {
        var query = _db.Exams.AsNoTracking();
        if (classId.HasValue)
            query = query.Where(x => x.ClassId == classId);
        return await query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
    }

    public async Task<Exam> AddAsync(Exam entity, CancellationToken ct = default)
    {
        _db.Exams.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }
}
