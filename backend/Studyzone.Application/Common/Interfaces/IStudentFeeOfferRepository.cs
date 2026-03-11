using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IStudentFeeOfferRepository
{
    Task<StudentFeeOffer?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<StudentFeeOffer?> GetByStudentAndAcademicYearAsync(Guid studentId, Guid academicYearId, CancellationToken ct = default);
    Task<IReadOnlyList<StudentFeeOffer>> GetByAcademicYearAsync(Guid academicYearId, CancellationToken ct = default);
    Task<StudentFeeOffer> AddAsync(StudentFeeOffer entity, CancellationToken ct = default);
    Task UpdateAsync(StudentFeeOffer entity, CancellationToken ct = default);
    Task DeleteAsync(StudentFeeOffer entity, CancellationToken ct = default);
}
