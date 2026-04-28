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

    public async Task<IReadOnlyList<Exam>> GetAllForClassIdsAsync(IReadOnlyList<Guid> classIds, CancellationToken ct = default)
    {
        if (classIds == null || classIds.Count == 0)
            return Array.Empty<Exam>();

        // Exams linked via ExamClasses junction
        var viaJunction = await _db.ExamClasses.AsNoTracking()
            .Where(ec => classIds.Contains(ec.ClassId))
            .Select(ec => ec.ExamId)
            .Distinct()
            .ToListAsync(ct);

        // Legacy: exams with ClassId column set (not yet migrated to junction)
        var viaLegacy = await _db.Exams.AsNoTracking()
            .Where(x => x.ClassId.HasValue && classIds.Contains(x.ClassId.Value))
            .Select(x => x.Id)
            .ToListAsync(ct);

        var allIds = viaJunction.Union(viaLegacy).Distinct().ToList();
        if (allIds.Count == 0) return Array.Empty<Exam>();

        return await _db.Exams.AsNoTracking()
            .Where(x => allIds.Contains(x.Id))
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Exam>> GetAllForClassAndBatchIdsAsync(IReadOnlyList<Guid> classIds, IReadOnlyList<Guid> batchIds, CancellationToken ct = default)
    {
        var safeClassIds = classIds ?? Array.Empty<Guid>();
        var safeBatchIds = batchIds ?? Array.Empty<Guid>();
        if (safeClassIds.Count == 0 && safeBatchIds.Count == 0)
            return Array.Empty<Exam>();

        var query = _db.ExamClasses.AsNoTracking().AsQueryable();
        if (safeClassIds.Count > 0 && safeBatchIds.Count > 0)
        {
            query = query.Where(ec =>
                (ec.BatchId.HasValue && safeBatchIds.Contains(ec.BatchId.Value)) ||
                (!ec.BatchId.HasValue && safeClassIds.Contains(ec.ClassId)));
        }
        else if (safeBatchIds.Count > 0)
        {
            query = query.Where(ec => ec.BatchId.HasValue && safeBatchIds.Contains(ec.BatchId.Value));
        }
        else
        {
            query = query.Where(ec => !ec.BatchId.HasValue && safeClassIds.Contains(ec.ClassId));
        }

        var viaJunction = await query.Select(ec => ec.ExamId).Distinct().ToListAsync(ct);

        var viaLegacy = safeClassIds.Count == 0
            ? new List<Guid>()
            : await _db.Exams.AsNoTracking()
                .Where(x => x.ClassId.HasValue && safeClassIds.Contains(x.ClassId.Value))
                .Select(x => x.Id)
                .ToListAsync(ct);

        var allIds = viaJunction.Union(viaLegacy).Distinct().ToList();
        if (allIds.Count == 0) return Array.Empty<Exam>();

        return await _db.Exams.AsNoTracking()
            .Where(x => allIds.Contains(x.Id))
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<Exam> AddAsync(Exam entity, CancellationToken ct = default)
    {
        _db.Exams.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<Exam> UpdateAsync(Exam entity, CancellationToken ct = default)
    {
        _db.Exams.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<IReadOnlyList<ExamClass>> GetExamClassesByExamIdAsync(Guid examId, CancellationToken ct = default)
    {
        return await _db.ExamClasses.AsNoTracking()
            .Where(ec => ec.ExamId == examId)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ExamClass>> GetExamClassesByExamIdsAsync(IReadOnlyList<Guid> examIds, CancellationToken ct = default)
    {
        if (examIds == null || examIds.Count == 0) return Array.Empty<ExamClass>();
        return await _db.ExamClasses.AsNoTracking()
            .Where(ec => examIds.Contains(ec.ExamId))
            .ToListAsync(ct);
    }

    public async Task AddExamClassesAsync(IReadOnlyList<ExamClass> links, CancellationToken ct = default)
    {
        _db.ExamClasses.AddRange(links);
        await _db.SaveChangesAsync(ct);
    }
}
