using Studyzone.Domain.Entities;

namespace Studyzone.Application.Common.Interfaces;

public interface IFeeStructureRepository
{
    Task<FeeStructure?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<FeeStructure>> GetByClassIdAsync(Guid classId, CancellationToken ct = default);
    Task<IReadOnlyList<FeeStructure>> GetByClassIdAndAcademicYearAsync(Guid classId, Guid academicYearId, CancellationToken ct = default);
    Task<IReadOnlyList<FeeStructure>> GetByAcademicYearAsync(Guid academicYearId, CancellationToken ct = default);
    Task<IReadOnlyList<FeeStructure>> GetAllAsync(CancellationToken ct = default);
    Task<FeeStructure> AddAsync(FeeStructure entity, CancellationToken ct = default);
    Task UpdateAsync(FeeStructure entity, CancellationToken ct = default);
}
