using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class StudentEnrollmentRepository : IStudentEnrollmentRepository
{
    private readonly ApplicationDbContext _db;
    private readonly IAcademicYearRepository _academicYearRepo;

    public StudentEnrollmentRepository(ApplicationDbContext db, IAcademicYearRepository academicYearRepo)
    {
        _db = db;
        _academicYearRepo = academicYearRepo;
    }

    public async Task<StudentEnrollment?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.StudentEnrollments.FindAsync([id], ct);
    }

    public async Task<StudentEnrollment?> GetByStudentAndAcademicYearAsync(Guid studentId, Guid academicYearId, CancellationToken ct = default)
    {
        return await _db.StudentEnrollments
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.StudentId == studentId && x.AcademicYearId == academicYearId, ct);
    }

    public async Task<IReadOnlyList<StudentEnrollment>> GetByAcademicYearAsync(Guid academicYearId, Guid? classId, Guid? batchId, string? statusFilter, int skip, int take, CancellationToken ct = default)
    {
        var query = _db.StudentEnrollments
            .Include(x => x.Student)
            .AsNoTracking()
            .Where(x => x.AcademicYearId == academicYearId);
        if (classId.HasValue)
            query = query.Where(x => x.ClassId == classId);
        if (batchId.HasValue)
            query = query.Where(x => x.BatchId == batchId);
        if (!string.IsNullOrWhiteSpace(statusFilter))
            query = query.Where(x => x.Status == statusFilter);
        return await query
            .OrderBy(x => x.Student != null ? x.Student.Name : "")
            .Skip(skip)
            .Take(take)
            .ToListAsync(ct);
    }

    public async Task<int> CountByAcademicYearAsync(Guid academicYearId, Guid? classId, Guid? batchId, string? statusFilter, CancellationToken ct = default)
    {
        var query = _db.StudentEnrollments.AsNoTracking().Where(x => x.AcademicYearId == academicYearId);
        if (classId.HasValue)
            query = query.Where(x => x.ClassId == classId);
        if (batchId.HasValue)
            query = query.Where(x => x.BatchId == batchId);
        if (!string.IsNullOrWhiteSpace(statusFilter))
            query = query.Where(x => x.Status == statusFilter);
        return await query.CountAsync(ct);
    }

    public async Task<bool> ExistsAsync(Guid studentId, Guid academicYearId, CancellationToken ct = default)
    {
        return await _db.StudentEnrollments.AnyAsync(x => x.StudentId == studentId && x.AcademicYearId == academicYearId, ct);
    }

    public async Task<StudentEnrollment?> GetCurrentForStudentAsync(Guid studentId, CancellationToken ct = default)
    {
        var currentYear = await _academicYearRepo.GetCurrentAsync(ct);
        if (currentYear == null) return null;
        return await GetByStudentAndAcademicYearAsync(studentId, currentYear.Id, ct);
    }

    public async Task<StudentEnrollment> AddAsync(StudentEnrollment entity, CancellationToken ct = default)
    {
        entity.Id = Guid.NewGuid();
        entity.CreatedAt = DateTime.UtcNow;
        _db.StudentEnrollments.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task<StudentEnrollment> UpdateAsync(StudentEnrollment entity, CancellationToken ct = default)
    {
        _db.StudentEnrollments.Update(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }
}