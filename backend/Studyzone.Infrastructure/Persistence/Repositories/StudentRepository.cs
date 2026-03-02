using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class StudentRepository : IStudentRepository
{
    private readonly ApplicationDbContext _db;

    public StudentRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<Student?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Students.FindAsync(new object[] { id }, ct);
    }

    public async Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await _db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId, ct);
    }

    public async Task<Student?> GetByAdmissionNumberAsync(string admissionNumber, CancellationToken ct = default)
    {
        return await _db.Students.AsNoTracking().FirstOrDefaultAsync(x => x.AdmissionNumber == admissionNumber, ct);
    }

    public async Task<Student> AddAsync(Student entity, CancellationToken ct = default)
    {
        _db.Students.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(Student entity, CancellationToken ct = default)
    {
        entity.UpdatedAt = DateTime.UtcNow;
        _db.Students.Update(entity);
        await _db.SaveChangesAsync(ct);
    }
}
