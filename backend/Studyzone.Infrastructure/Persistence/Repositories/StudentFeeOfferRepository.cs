using Microsoft.EntityFrameworkCore;
using Studyzone.Application.Common.Interfaces;
using Studyzone.Domain.Entities;
using Studyzone.Infrastructure.Persistence;

namespace Studyzone.Infrastructure.Persistence.Repositories;

public class StudentFeeOfferRepository : IStudentFeeOfferRepository
{
    private readonly ApplicationDbContext _db;

    public StudentFeeOfferRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<StudentFeeOffer?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.StudentFeeOffers.FindAsync(new object[] { id }, ct);
    }

    public async Task<StudentFeeOffer?> GetByStudentAndAcademicYearAsync(Guid studentId, Guid academicYearId, CancellationToken ct = default)
    {
        return await _db.StudentFeeOffers
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.StudentId == studentId && x.AcademicYearId == academicYearId, ct);
    }

    public async Task<IReadOnlyList<StudentFeeOffer>> GetByAcademicYearAsync(Guid academicYearId, CancellationToken ct = default)
    {
        return await _db.StudentFeeOffers
            .AsNoTracking()
            .Include(x => x.Student)
            .Where(x => x.AcademicYearId == academicYearId)
            .OrderBy(x => x.Student.Name)
            .ToListAsync(ct);
    }

    public async Task<StudentFeeOffer> AddAsync(StudentFeeOffer entity, CancellationToken ct = default)
    {
        _db.StudentFeeOffers.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity;
    }

    public async Task UpdateAsync(StudentFeeOffer entity, CancellationToken ct = default)
    {
        _db.StudentFeeOffers.Update(entity);
        await _db.SaveChangesAsync(ct);
    }

    public async Task DeleteAsync(StudentFeeOffer entity, CancellationToken ct = default)
    {
        _db.StudentFeeOffers.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}
